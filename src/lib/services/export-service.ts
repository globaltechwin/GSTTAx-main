import * as XLSX from "xlsx";
import Papa from "papaparse";
import { prisma } from "@/lib/db";

export type ExportModule = "companies" | "to-companies" | "invoices" | "referrals";
export type ExportFormat = "excel" | "csv" | "json";

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  companyId?: number;
}

async function fetchModuleData(
  module: ExportModule,
  filters: ExportFilters,
  adminId: number
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = { adminId };

  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
    where.date = dateFilter;
  }

  if (filters.companyId && module === "invoices") {
    where.companyId = filters.companyId;
  }

  switch (module) {
    case "companies": {
      const rows = await prisma.company.findMany({ where: where as never, orderBy: { id: "asc" } });
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
        state: r.state ?? "",
        stateCode: r.stateCode ?? "",
        bankHolderName: r.bankHolderName ?? "",
        bankAccountNumber: r.bankAccountNumber ?? "",
        bankIfscCode: r.bankIfscCode ?? "",
        bankName: r.bankName ?? "",
        bankBranchName: r.bankBranchName ?? "",
        website: r.website ?? "",
        status: r.status,
      })) as Record<string, unknown>[];
    }
    case "to-companies": {
      const rows = await prisma.toCompany.findMany({
        where: where as never,
        orderBy: { id: "asc" },
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        gstNo: r.gstNo ?? "",
        vendorCode: r.vendorCode ?? "",
        email: r.email ?? "",
        address: r.address ?? "",
        state: r.state ?? "",
        stateCode: r.stateCode ?? "",
        date: r.date.toISOString().split("T")[0],
      })) as Record<string, unknown>[];
    }
    case "referrals": {
      const rows = await prisma.referral.findMany({
        where: where as never,
        orderBy: { id: "asc" },
      });
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
        where: where as never,
        include: { company: true, toCompany: true, items: true },
        orderBy: { id: "asc" },
      });
      return rows.map((r) => ({
        ...r,
        adminId: undefined,
        date: r.date.toISOString().split("T")[0],
        dateOfSupply: r.dateOfSupply?.toISOString().split("T")[0] ?? "",
        id: r.id,
        orderId: r.orderId,
        company: r.company?.name ?? "",
        toCompany: r.toCompany?.name ?? "",
        amount: r.amount?.toString() ?? "0",
        total: r.total?.toString() ?? "0",
        items: r.items.map((item) => ({
          description: item.description ?? "",
          hsn: item.hsn ?? "",
          sac: item.sac ?? "",
          quantity: item.quantity.toString(),
          unit: item.unit,
          price: item.price.toString(),
          per: item.per,
          amount: item.amount.toString(),
          gstType: item.gstType ?? "",
          igstRate: item.igstRate?.toString() ?? "",
          cgstRate: item.cgstRate?.toString() ?? "",
          sgstRate: item.sgstRate?.toString() ?? "",
        })),
      })) as Record<string, unknown>[];
    }
  }
}

function formatData(
  data: Record<string, unknown>[],
  format: ExportFormat
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
    const csv = Papa.unparse(data);
    return {
      buffer: Buffer.from(csv, "utf-8"),
      extension: "csv",
      mimeType: "text/csv",
    };
  }

  // Excel
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return {
    buffer: Buffer.from(xlsxBuffer),
    extension: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export async function exportData(
  module: ExportModule,
  format: ExportFormat,
  filters: ExportFilters,
  user: string,
  adminId: number
): Promise<{
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  historyId: number;
  recordCount: number;
}> {
  const data = await fetchModuleData(module, filters, adminId);
  const { buffer, extension, mimeType } = formatData(data, format);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `export_${module}_${timestamp}.${extension}`;
  const fileSize = `${(buffer.length / 1024).toFixed(1)} KB`;

  const history = await prisma.exportHistory.create({
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

  return { buffer, fileName, mimeType, historyId: history.id, recordCount: data.length };
}
