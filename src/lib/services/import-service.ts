import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type ImportModule = "database" | "companies" | "to-companies" | "invoices" | "referrals";

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

function parseFileContent(buffer: Buffer, fileType: string): Record<string, unknown>[] {
  switch (fileType) {
    case "sql":
    case "json": {
      const text = buffer.toString("utf-8");
      const data: unknown = JSON.parse(text);
      return Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : [data as Record<string, unknown>];
    }
    case "csv": {
      const text = buffer.toString("utf-8");
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      return records as Record<string, unknown>[];
    }
    case "xlsx":
    case "xls": {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return [];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

function mapRowToModel(
  row: Record<string, unknown>,
  module: ImportModule
): Record<string, unknown> | null {
  if (module === "companies") {
    return {
      name: String(row.name || row.Name || row.company_name || "").trim(),
      gstNo: String(row.gstNo || row.gst_no || row.GST || "").trim(),
      email: String(row.email || row.Email || "").trim(),
      date: parseDate(row.date || row.Date),
      ssiNo: String(row.ssiNo || row.ssi_no || "").trim(),
      panNo: String(row.panNo || row.pan_no || row.PAN || "").trim(),
      phone: String(row.phone || row.Phone || "").trim(),
      esiNo: String(row.esiNo || row.esi_no || "").trim(),
      address: String(row.address || row.Address || "").trim(),
      epfNo: String(row.epfNo || row.epf_no || "").trim(),
    };
  }
  if (module === "to-companies") {
    return {
      name: String(row.name || row.Name || row.company_name || "").trim(),
      gstNo: String(row.gstNo || row.gst_no || row.GST || "").trim(),
      vendorCode: String(row.vendorCode || row.vendor_code || row.VendorCode || "").trim(),
      date: parseDate(row.date || row.Date),
    };
  }
  if (module === "referrals") {
    return {
      name: String(row.name || row.Name || "").trim(),
      email: String(row.email || row.Email || "").trim(),
      mobile: String(row.mobile || row.Mobile || row.phone || "").trim(),
      date: parseDate(row.date || row.Date),
    };
  }
  if (module === "invoices") {
    return {
      orderId: String(row.orderId || row.order_id || row.OrderId || "").trim(),
      email: String(row.email || row.Email || "").trim(),
      gst: String(row.gst || row.GST || "").trim(),
      amount: parseFloat(String(row.amount || row.Amount || 0)) || 0,
      total: parseFloat(String(row.total || row.Total || 0)) || 0,
      date: parseDate(row.date || row.Date),
    };
  }
  return null;
}

function parseDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

async function checkDuplicate(
  module: ImportModule,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    if (module === "companies") {
      const existing = await prisma.company.findFirst({
        where: { name: data.name as string, date: data.date as Date },
      });
      return !!existing;
    }
    if (module === "to-companies") {
      const existing = await prisma.toCompany.findFirst({
        where: { name: data.name as string, date: data.date as Date },
      });
      return !!existing;
    }
    if (module === "referrals") {
      const existing = await prisma.referral.findFirst({
        where: { name: data.name as string, date: data.date as Date },
      });
      return !!existing;
    }
    if (module === "invoices") {
      const existing = await prisma.invoice.findFirst({
        where: { orderId: data.orderId as string },
      });
      return !!existing;
    }
  } catch {
    return false;
  }
  return false;
}

export async function importData(
  buffer: Buffer,
  fileType: string,
  module: ImportModule,
  user: string
): Promise<ImportResult & { historyId: number }> {
  const fileName = `import_${module}_${Date.now()}.${fileType}`;
  const fileSize = `${(buffer.length / 1024).toFixed(1)} KB`;

  const history = await prisma.importHistory.create({
    data: {
      module,
      fileName,
      fileType: fileType.toUpperCase(),
      fileSize,
      status: "processing",
      user,
    },
  });

  try {
    const records = parseFileContent(buffer, fileType);
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const rawRow of records) {
      try {
        const mapped = mapRowToModel(rawRow, module);
        if (!mapped || !mapped.name) {
          skipped++;
          continue;
        }

        const isDuplicate = await checkDuplicate(module, mapped);
        if (isDuplicate) {
          skipped++;
          continue;
        }

        if (module === "companies") {
          await prisma.company.create({ data: mapped as Prisma.CompanyCreateInput });
        } else if (module === "to-companies") {
          await prisma.toCompany.create({ data: mapped as Prisma.ToCompanyCreateInput });
        } else if (module === "referrals") {
          await prisma.referral.create({ data: mapped as Prisma.ReferralCreateInput });
        } else if (module === "invoices") {
          await prisma.invoice.create({ data: mapped as Prisma.InvoiceCreateInput });
        }
        imported++;
      } catch (err) {
        failed++;
        errors.push(`Row error: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    await prisma.importHistory.update({
      where: { id: history.id },
      data: { status: "success", imported, skipped, failed },
    });

    return { imported, skipped, failed, errors, historyId: history.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown import error";
    await prisma.importHistory.update({
      where: { id: history.id },
      data: { status: "failed", errorMsg },
    });
    throw new Error(errorMsg);
  }
}
