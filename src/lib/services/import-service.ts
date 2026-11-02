import * as XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type ImportModule = "companies" | "to-companies" | "referrals";

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

function parseFileContent(buffer: Buffer, fileType: string): Record<string, unknown>[] {
  switch (fileType) {
    case "json": {
      const text = buffer.toString("utf-8");
      const data: unknown = JSON.parse(text);
      if (Array.isArray(data) && data.every((row) => row && typeof row === "object")) {
        return data as Record<string, unknown>[];
      }
      if (data && typeof data === "object") return [data as Record<string, unknown>];
      throw new Error("JSON import must contain an object or an array of objects");
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
      state: String(row.state || row.State || "").trim(),
      stateCode: String(row.stateCode || row.state_code || "").trim(),
      bankHolderName: String(row.bankHolderName || row.bank_holder_name || "").trim(),
      bankAccountNumber: String(row.bankAccountNumber || row.bank_account_number || "").trim(),
      bankIfscCode: String(row.bankIfscCode || row.bank_ifsc_code || "").trim(),
      bankName: String(row.bankName || row.bank_name || "").trim(),
      bankBranchName: String(row.bankBranchName || row.bank_branch_name || "").trim(),
      website: String(row.website || row.Website || "").trim(),
      status: String(row.status || "active").trim(),
    };
  }
  if (module === "to-companies") {
    return {
      name: String(row.name || row.Name || row.company_name || "").trim(),
      gstNo: String(row.gstNo || row.gst_no || row.GST || "").trim(),
      vendorCode: String(row.vendorCode || row.vendor_code || row.VendorCode || "").trim(),
      email: String(row.email || row.Email || "").trim(),
      address: String(row.address || row.Address || "").trim(),
      state: String(row.state || row.State || "").trim(),
      stateCode: String(row.stateCode || row.state_code || "").trim(),
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
  return null;
}

function parseDate(val: unknown): Date {
  if (!val) throw new Error("A valid date is required");
  if (val instanceof Date) return val;
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  throw new Error(`Invalid date: ${str}`);
}

async function checkDuplicate(
  module: ImportModule,
  data: Record<string, unknown>,
  adminId: number
): Promise<boolean> {
  if (module === "companies") {
    const existing = await prisma.company.findFirst({
      where: { adminId, name: data.name as string, date: data.date as Date },
      select: { id: true },
    });
    return !!existing;
  }
  if (module === "to-companies") {
    const existing = await prisma.toCompany.findFirst({
      where: { adminId, name: data.name as string, date: data.date as Date },
      select: { id: true },
    });
    return !!existing;
  }
  if (module === "referrals") {
    const existing = await prisma.referral.findFirst({
      where: { adminId, name: data.name as string, date: data.date as Date },
      select: { id: true },
    });
    return !!existing;
  }
  return false;
}

export async function importData(
  buffer: Buffer,
  fileType: string,
  module: ImportModule,
  user: string,
  adminId: number
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
      adminId,
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

        const isDuplicate = await checkDuplicate(module, mapped, adminId);
        if (isDuplicate) {
          skipped++;
          continue;
        }

        if (module === "companies") {
          await prisma.company.create({
            data: {
              ...mapped,
              adminId,
            } as Prisma.CompanyUncheckedCreateInput,
          });
        } else if (module === "to-companies") {
          await prisma.toCompany.create({
            data: {
              ...mapped,
              adminId,
            } as Prisma.ToCompanyUncheckedCreateInput,
          });
        } else if (module === "referrals") {
          await prisma.referral.create({
            data: {
              ...mapped,
              adminId,
            } as Prisma.ReferralUncheckedCreateInput,
          });
        }
        imported++;
      } catch (err) {
        failed++;
        errors.push(`Row error: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    await prisma.importHistory.update({
      where: { id: history.id },
      data: {
        status: imported === 0 && failed > 0 ? "failed" : "success",
        imported,
        skipped,
        failed,
        errorMsg: errors.length ? errors.join("\n").slice(0, 10_000) : null,
      },
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
