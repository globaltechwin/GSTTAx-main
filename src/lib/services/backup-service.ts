import * as XLSX from "xlsx";
import Papa from "papaparse";
import { prisma } from "@/lib/db";

export type BackupModule = "database" | "companies" | "to-companies" | "invoices" | "referrals";
export type BackupFormat = "excel" | "csv" | "json";

async function fetchBackupData(module: BackupModule): Promise<Record<string, unknown>[]> {
  switch (module) {
    case "companies": {
      const rows = await prisma.company.findMany({ orderBy: { id: "asc" } });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        gstNo: r.gstNo ?? "",
        email: r.email ?? "",
        date: r.date.toISOString().split("T")[0],
        ssiNo: r.ssiNo ?? "",
        panNo: r.panNo ?? "",
        phone: r.phone ?? "",
        esiNo: r.esiNo ?? "",
        address: r.address ?? "",
        epfNo: r.epfNo ?? "",
      })) as Record<string, unknown>[];
    }
    case "to-companies": {
      const rows = await prisma.toCompany.findMany({ orderBy: { id: "asc" } });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        gstNo: r.gstNo ?? "",
        vendorCode: r.vendorCode ?? "",
        date: r.date.toISOString().split("T")[0],
      })) as Record<string, unknown>[];
    }
    case "referrals": {
      const rows = await prisma.referral.findMany({ orderBy: { id: "asc" } });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email ?? "",
        mobile: r.mobile ?? "",
        date: r.date.toISOString().split("T")[0],
      })) as Record<string, unknown>[];
    }
    case "invoices": {
      const rows = await prisma.invoice.findMany({
        include: { company: true, toCompany: true, items: true },
        orderBy: { id: "asc" },
      });
      return rows.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        company: r.company?.name ?? "",
        toCompany: r.toCompany?.name ?? "",
        email: r.email ?? "",
        gst: r.gst ?? "",
        amount: r.amount?.toString() ?? "0",
        total: r.total?.toString() ?? "0",
        date: r.date.toISOString().split("T")[0],
        items: r.items.map((i) => ({
          description: i.description ?? "",
          hsn: i.hsn ?? "",
          sac: i.sac ?? "",
          quantity: i.quantity.toString(),
          price: i.price.toString(),
          per: i.per,
          amount: i.amount.toString(),
        })),
      })) as Record<string, unknown>[];
    }
    case "database": {
      const [companies, toCompanies, referrals, invoices] = await Promise.all([
        prisma.company.findMany({ orderBy: { id: "asc" } }),
        prisma.toCompany.findMany({ orderBy: { id: "asc" } }),
        prisma.referral.findMany({ orderBy: { id: "asc" } }),
        prisma.invoice.findMany({ include: { items: true }, orderBy: { id: "asc" } }),
      ]);
      return [
        {
          backupDate: new Date().toISOString(),
          companies,
          toCompanies,
          referrals,
          invoices,
        },
      ];
    }
    default:
      return [];
  }
}

function flattenForCSV(obj: Record<string, unknown>): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val)) {
      for (const item of val) {
        result.push({ _module: key, ...(item as Record<string, unknown>) });
      }
    }
  }
  return result.length > 0 ? result : [obj];
}

function formatBackup(
  data: Record<string, unknown>[],
  format: BackupFormat
): { buffer: Buffer; extension: string; mimeType: string } {
  if (format === "json") {
    const json = JSON.stringify(data, null, 2);
    return {
      buffer: Buffer.from(json, "utf-8"),
      extension: "json",
      mimeType: "application/json",
    };
  }

  if (format === "csv") {
    const flat =
      data.length === 1 && typeof data[0] === "object"
        ? flattenForCSV(data[0] as Record<string, unknown>)
        : data;
    const csv = Papa.unparse(flat);
    return {
      buffer: Buffer.from(csv, "utf-8"),
      extension: "csv",
      mimeType: "text/csv",
    };
  }

  // Excel
  const workbook = XLSX.utils.book_new();
  if (data.length === 1 && typeof data[0] === "object") {
    const obj = data[0] as Record<string, unknown>;
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        const sheet = XLSX.utils.json_to_sheet(val);
        XLSX.utils.book_append_sheet(workbook, sheet, key.slice(0, 31));
      }
    }
  } else {
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  }
  const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return {
    buffer: Buffer.from(xlsxBuffer),
    extension: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export async function createBackup(
  module: BackupModule,
  format: BackupFormat,
  user: string
): Promise<{
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  historyId: number;
  recordCount: number;
}> {
  const data = await fetchBackupData(module);
  const { buffer, extension, mimeType } = formatBackup(data, format);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const fileName = `backup_${module}_${timestamp}.${extension}`;
  const fileSize = `${(buffer.length / 1024).toFixed(1)} KB`;

  const totalRecords = data.reduce((sum, item) => {
    let count = 0;
    for (const val of Object.values(item)) {
      if (Array.isArray(val)) count += val.length;
    }
    return sum + (count || 1);
  }, 0);

  const history = await prisma.backupHistory.create({
    data: {
      module,
      fileName,
      fileType: extension.toUpperCase(),
      fileSize,
      format: format.toUpperCase(),
      status: "success",
      user,
      recordCount: totalRecords,
    },
  });

  return { buffer, fileName, mimeType, historyId: history.id, recordCount: totalRecords };
}
