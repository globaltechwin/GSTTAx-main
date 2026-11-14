export type InvoiceNumberingSettings = {
  invoiceNumberEnabled: boolean;
  invoiceNumberPrefix: string;
  invoiceNumberFormat: string;
  invoiceNumberStart: number;
  invoiceNumberPadding: number;
  invoiceAllowManualOverride: boolean;
};

export const DEFAULT_INVOICE_NUMBERING: InvoiceNumberingSettings = {
  invoiceNumberEnabled: true,
  invoiceNumberPrefix: "IN",
  invoiceNumberFormat: "{prefix}-{number}/{FY}",
  invoiceNumberStart: 1,
  invoiceNumberPadding: 2,
  invoiceAllowManualOverride: false,
};

export function parseInvoiceNumbering(value: unknown): InvoiceNumberingSettings {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const start = Number(raw.invoiceNumberStart);
  const padding = Number(raw.invoiceNumberPadding);
  return {
    invoiceNumberEnabled: raw.invoiceNumberEnabled !== false && raw.invoiceNumberEnabled !== "false",
    invoiceNumberPrefix: typeof raw.invoiceNumberPrefix === "string" ? raw.invoiceNumberPrefix.trim().slice(0, 8) : DEFAULT_INVOICE_NUMBERING.invoiceNumberPrefix,
    invoiceNumberFormat: typeof raw.invoiceNumberFormat === "string" ? raw.invoiceNumberFormat.trim().slice(0, 50) : DEFAULT_INVOICE_NUMBERING.invoiceNumberFormat,
    invoiceNumberStart: Number.isSafeInteger(start) && start >= 1 ? start : DEFAULT_INVOICE_NUMBERING.invoiceNumberStart,
    invoiceNumberPadding: Number.isSafeInteger(padding) && padding >= 1 && padding <= 8 ? padding : DEFAULT_INVOICE_NUMBERING.invoiceNumberPadding,
    invoiceAllowManualOverride: raw.invoiceAllowManualOverride === true || raw.invoiceAllowManualOverride === "true",
  };
}

export function getIndianFinancialYear(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const startYear = month >= 4 ? year : year - 1;
  return `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
}

export function formatInvoiceNumber(
  settings: InvoiceNumberingSettings,
  sequence: number,
  date: Date,
): string {
  const paddedNumber = String(sequence).padStart(settings.invoiceNumberPadding, "0");
  const format = settings.invoiceNumberFormat || DEFAULT_INVOICE_NUMBERING.invoiceNumberFormat;
  return format
    .replaceAll("{prefix}", settings.invoiceNumberPrefix)
    .replaceAll("{number}", paddedNumber)
    .replaceAll("{FY}", getIndianFinancialYear(date));
}

export function validateInvoiceNumberFormat(format: string): boolean {
  if (!format || format.length > 50 || !format.includes("{number}") || !format.includes("{FY}")) return false;
  const withoutTokens = format.replace(/\{(?:prefix|number|FY)\}/g, "");
  if (/[{}]/.test(withoutTokens)) return false;
  const expandedLength = format
    .replaceAll("{prefix}", "12345678")
    .replaceAll("{number}", "12345678")
    .replaceAll("{FY}", "99-99").length;
  return expandedLength <= 50;
}

/** Extract the numeric sequence from an invoice number generated with the current format.
 * Also supports old plain-numeric invoice numbers during the first migration to formatted IDs.
 */
export function extractInvoiceSequenceValue(
  invoiceNo: string | null | undefined,
  settings: InvoiceNumberingSettings,
  financialYear: string,
): number {
  if (!invoiceNo) return 0;
  const format = settings.invoiceNumberFormat || DEFAULT_INVOICE_NUMBERING.invoiceNumberFormat;
  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokenPattern = /\{(prefix|number|FY)\}/g;
  let cursor = 0;
  let source = "^";
  let numberCapture = 0;
  for (const match of format.matchAll(tokenPattern)) {
    const tokenIndex = match.index ?? 0;
    source += escapeRegex(format.slice(cursor, tokenIndex));
    if (match[1] === "number") {
      numberCapture += 1;
      source += "(\\d+)";
    } else if (match[1] === "prefix") {
      source += "(?:.+?)";
    } else {
      source += escapeRegex(financialYear);
    }
    cursor = tokenIndex + match[0].length;
  }
  source += escapeRegex(format.slice(cursor)) + "$";
  if (numberCapture > 0) {
    const match = invoiceNo.match(new RegExp(source));
    const value = match ? Number.parseInt(match[1], 10) : 0;
    if (Number.isSafeInteger(value) && value > 0) return value;
  }
  // Legacy invoices sometimes stored a bare numeric value (for example, "9").
  const legacyMatch = invoiceNo.match(/^\s*(\d+)\s*$/);
  const legacyValue = legacyMatch ? Number.parseInt(legacyMatch[1], 10) : 0;
  return Number.isSafeInteger(legacyValue) && legacyValue > 0 ? legacyValue : 0;
}
