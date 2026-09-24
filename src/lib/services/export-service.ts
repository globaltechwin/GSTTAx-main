import * as XLSX from "xlsx";
import Papa from "papaparse";
import { prisma } from "@/lib/db";

export type ExportModule = "database" | "companies" | "to-companies" | "invoices" | "referrals";
export type ExportFormat = "excel" | "csv" | "json";

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  companyId?: number;
}

async function fetchModuleData(
  module: ExportModule,
  filters: ExportFilters
): Promise<Record<string, unknown>[]> {
  const where: Record<string, unknown> = {};

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
        id: r.id,
        orderId: r.orderId,
        company: r.company?.name ?? "",
        toCompany: r.toCompany?.name ?? "",
        email: r.email ?? "",
        gst: r.gst ?? "",
        amount: r.amount?.toString() ?? "0",
        total: r.total?.toString() ?? "0",
        date: r.date.toISOString().split("T")[0],
        items: r.items.length,
      })) as Record<string, unknown>[];
    }
    case "database": {
      const [companies, toCompanies, referrals, invoices] = await Promise.all([
        prisma.company.findMany({ orderBy: { id: "asc" } }),
        prisma.toCompany.findMany({ orderBy: { id: "asc" } }),
        prisma.referral.findMany({ orderBy: { id: "asc" } }),
        prisma.invoice.findMany({ orderBy: { id: "asc" } }),
      ]);
      return [
        {
          companies,
          toCompanies,
          referrals,
          invoices,
          exportedAt: new Date().toISOString(),
        },
      ];
    }
    default:
      return [];
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
  user: string
): Promise<{
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  historyId: number;
  recordCount: number;
}> {
  const data = await fetchModuleData(module, filters);
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
      recordCount: data.length,
    },
  });

  return { buffer, fileName, mimeType, historyId: history.id, recordCount: data.length };
}
