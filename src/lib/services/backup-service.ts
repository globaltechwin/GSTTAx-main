import * as XLSX from "xlsx";
import Papa from "papaparse";
import { prisma } from "@/lib/db";

export type BackupModule = "companies" | "to-companies" | "invoices" | "referrals";
export type BackupFormat = "excel" | "csv" | "json";

async function fetchBackupData(
  module: BackupModule,
  adminId: number
): Promise<Record<string, unknown>[]> {
  switch (module) {
    case "companies": {
      const records = await prisma.company.findMany({
        where: { adminId },
        orderBy: { id: "asc" },
      });
      return records.map(({ adminId: _adminId, ...record }) => ({
        ...record,
        date: record.date.toISOString(),
      }));
    }
    case "to-companies": {
      const records = await prisma.toCompany.findMany({
        where: { adminId },
        orderBy: { id: "asc" },
      });
      return records.map(({ adminId: _adminId, ...record }) => ({
        ...record,
        date: record.date.toISOString(),
      }));
    }
    case "referrals": {
      const records = await prisma.referral.findMany({
        where: { adminId },
        orderBy: { id: "asc" },
      });
      return records.map(({ adminId: _adminId, ...record }) => ({
        ...record,
        date: record.date.toISOString(),
      }));
    }
    case "invoices": {
      const records = await prisma.invoice.findMany({
        where: { adminId },
        include: { items: true },
        orderBy: { id: "asc" },
      });
      return records.map(({ adminId: _adminId, ...record }) => ({
        ...record,
        date: record.date.toISOString(),
        dateOfSupply: record.dateOfSupply?.toISOString() ?? null,
        amount: record.amount?.toString() ?? null,
        total: record.total?.toString() ?? null,
        cgstRate: record.cgstRate.toString(),
        sgstRate: record.sgstRate.toString(),
        igstRate: record.igstRate.toString(),
        items: record.items.map((item) => ({
          ...item,
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          amount: item.amount.toString(),
          igstRate: item.igstRate?.toString() ?? null,
          cgstRate: item.cgstRate?.toString() ?? null,
          sgstRate: item.sgstRate?.toString() ?? null,
        })),
      }));
    }
  }
}

function formatBackup(
  module: BackupModule,
  data: Record<string, unknown>[],
  format: BackupFormat
): { buffer: Buffer; extension: string; mimeType: string } {
  if (format === "json") {
    const json = JSON.stringify(
      { formatVersion: 1, module, generatedAt: new Date().toISOString(), records: data },
      null,
      2
    );
    return {
      buffer: Buffer.from(json, "utf-8"),
      extension: "json",
      mimeType: "application/json",
    };
  }

  if (format === "csv") {
    return {
      buffer: Buffer.from(Papa.unparse(data), "utf-8"),
      extension: "csv",
      mimeType: "text/csv",
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      { formatVersion: 1, module, generatedAt: new Date().toISOString() },
    ]),
    "Metadata"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), "Records");
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
  user: string,
  adminId: number
): Promise<{
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  historyId: number;
  recordCount: number;
}> {
  const data = await fetchBackupData(module, adminId);
  const { buffer, extension, mimeType } = formatBackup(module, data, format);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const fileName = `backup_${module}_${timestamp}.${extension}`;
  const fileSize = `${(buffer.length / 1024).toFixed(1)} KB`;

  const history = await prisma.backupHistory.create({
    data: {
      module,
      fileName,
      fileType: extension.toUpperCase(),
      fileSize,
      format: format.toUpperCase(),
      status: "success",
      user,
      adminId,
      recordCount: data.length,
    },
  });

  return {
    buffer,
    fileName,
    mimeType,
    historyId: history.id,
    recordCount: data.length,
  };
}
