import type { Prisma } from "@/generated/prisma/client";
import { getIndianFinancialYear, validateInvoiceNumberFormat } from "@/lib/invoice-numbering";

export type NumberedDocumentType = "TAX_INVOICE" | "PROFORMA" | "DELIVERY_CHALLAN" | "PURCHASE_ORDER";
type NumberingConfig = {
  enabled: boolean;
  prefix: string;
  format: string;
  start: number;
  padding: number;
  allowManualOverride: boolean;
};

const defaults: Record<NumberedDocumentType, NumberingConfig> = {
  TAX_INVOICE: { enabled: true, prefix: "IN", format: "{prefix}-{number}/{FY}", start: 1, padding: 1, allowManualOverride: false },
  PROFORMA: { enabled: true, prefix: "PI", format: "{prefix}-{number}/{FY}", start: 1, padding: 1, allowManualOverride: false },
  DELIVERY_CHALLAN: { enabled: true, prefix: "DC", format: "{prefix}-{number}/{FY}", start: 1, padding: 1, allowManualOverride: false },
  PURCHASE_ORDER: { enabled: true, prefix: "PO", format: "{prefix}-{number}/{FY}", start: 1, padding: 1, allowManualOverride: false },
};

const settingPrefix: Record<NumberedDocumentType, string> = {
  TAX_INVOICE: "invoice",
  PROFORMA: "proforma",
  DELIVERY_CHALLAN: "deliveryChallan",
  PURCHASE_ORDER: "purchaseOrder",
};

export function parseDocumentNumbering(raw: unknown, type: NumberedDocumentType): NumberingConfig {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const prefix = settingPrefix[type];
  const base = defaults[type];
  const start = Number(value[`${prefix}NumberStart`]);
  const padding = Number(value[`${prefix}NumberPadding`]);
  const format = typeof value[`${prefix}NumberFormat`] === "string" ? String(value[`${prefix}NumberFormat`]).trim() : base.format;
  const candidate = {
    enabled: value[`${prefix}NumberEnabled`] !== false && value[`${prefix}NumberEnabled`] !== "false",
    prefix: typeof value[`${prefix}NumberPrefix`] === "string" ? String(value[`${prefix}NumberPrefix`]).trim().slice(0, 8) : base.prefix,
    format: validateInvoiceNumberFormat(format) ? format : base.format,
    start: 1,
    padding: 1,
    allowManualOverride: value[`${prefix}AllowManualOverride`] === true || value[`${prefix}AllowManualOverride`] === "true",
  };
  return candidate;
}

export function formatDocumentNumber(config: NumberingConfig, sequence: number, date: Date): string {
  return config.format
    .replaceAll("{prefix}", config.prefix)
    .replaceAll("{number}", String(sequence).padStart(config.padding, "0"))
    .replaceAll("{FY}", getIndianFinancialYear(date));
}

export function extractDocumentSequence(value: string | null | undefined, config: NumberingConfig, fy: string, type: NumberedDocumentType): number {
  if (!value) return 0;
  const escaped = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const token = /\{(prefix|number|FY)\}/g;
  let cursor = 0;
  let source = "^";
  let hasNumber = false;
  for (const match of config.format.matchAll(token)) {
    const index = match.index ?? 0;
    source += escaped(config.format.slice(cursor, index));
    if (match[1] === "number") { source += "(\\d+)"; hasNumber = true; }
    else if (match[1] === "prefix") source += escaped(config.prefix);
    else source += escaped(fy);
    cursor = index + match[0].length;
  }
  source += escaped(config.format.slice(cursor)) + "$";
  if (hasNumber) {
    const match = value.match(new RegExp(source));
    const number = match ? Number(match[1]) : 0;
    if (Number.isSafeInteger(number) && number > 0) return number;
  }
  if (/^\d+$/.test(value)) return Number(value) || 0;
  if (type === "TAX_INVOICE") {
    const legacy = value.match(/^(?:IN|INV|GST)-(\d+)$/i);
    if (legacy) return Number(legacy[1]) || 0;
  }
  if (type === "PROFORMA") {
    const legacy = value.match(/^PI-(\d+)$/i);
    if (legacy) return Number(legacy[1]) || 0;
  }
  if (type === "DELIVERY_CHALLAN") {
    const legacy = value.match(/^DC-(\d+)$/i);
    if (legacy) return Number(legacy[1]) || 0;
  }
  return 0;
}

export function financialYearBounds(date: Date) {
  const fy = getIndianFinancialYear(date);
  const startYear = 2000 + Number(fy.slice(0, 2));
  return { financialYear: fy, start: new Date(Date.UTC(startYear, 3, 1)), end: new Date(Date.UTC(startYear + 1, 3, 1)) };
}

export async function allocateDocumentNumber(
  tx: Prisma.TransactionClient,
  adminId: number,
  type: NumberedDocumentType,
  date: Date,
  settingsValue: unknown,
): Promise<string> {
  const config = parseDocumentNumbering(settingsValue, type);
  const requestedDate = Number.isNaN(date.getTime()) ? new Date() : date;
  if (!config.enabled) throw new Error("DOCUMENT_NUMBER_MANUAL_REQUIRED");
  const { financialYear, start, end } = financialYearBounds(requestedDate);

  let savedValues: Array<{ number: string }> = [];
  if (type === "TAX_INVOICE" || type === "PROFORMA") {
    const rows = await tx.invoice.findMany({ where: { adminId, documentType: type, date: { gte: start, lt: end } }, select: { invoiceNo: true } });
    savedValues = rows.map((row) => ({ number: row.invoiceNo || "" }));
  } else if (type === "DELIVERY_CHALLAN") {
    const rows = await tx.deliveryChallan.findMany({ where: { adminId, challanDate: { gte: start, lt: end } }, select: { challanNumber: true } });
    savedValues = rows.map((row) => ({ number: row.challanNumber }));
  } else {
    const rows = await tx.purchaseOrder.findMany({ where: { adminId, orderDate: { gte: start, lt: end } }, select: { poNumber: true } });
    savedValues = rows.map((row) => ({ number: row.poNumber }));
  }

  const highestSaved = savedValues.reduce((max, row) => Math.max(max, extractDocumentSequence(row.number, config, financialYear, type)), 0);
  const where = { adminId_documentType_financialYear: { adminId, documentType: type, financialYear } };
  // Option A: derive the next number from documents that still exist in this
  // Admin workspace. A deleted highest-numbered document is therefore reusable.
  // The sequence table is synchronized to the live maximum, not treated as
  // an independent historical counter.
  const baseline = Math.max(config.start - 1, highestSaved);
  await tx.documentNumberSequence.upsert({
    where,
    create: { adminId, documentType: type, financialYear, currentValue: baseline },
    update: { currentValue: baseline },
  });
  const allocated = await tx.documentNumberSequence.update({ where, data: { currentValue: { increment: 1 } }, select: { currentValue: true } });
  return formatDocumentNumber(config, allocated.currentValue, requestedDate);
}

export function getDocumentNumberingConfig(raw: unknown, type: NumberedDocumentType) { return parseDocumentNumbering(raw, type); }
