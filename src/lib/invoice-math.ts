const MAX_MONEY_CENTS = 999_999_999_999;

export interface NormalizedInvoiceItem {
  description: string | null;
  hsn: string | null;
  sac: string | null;
  quantity: number;
  unit: string;
  price: number;
  per: string;
  amount: number;
  gstType: string | null;
  igstRate: number | null;
  cgstRate: number | null;
  sgstRate: number | null;
}

function readNumber(value: unknown, name: string, max: number): number {
  const number = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0 || number > max) {
    throw new Error(`${name} must be a valid non-negative number`);
  }
  return number;
}

function readRate(value: unknown, name: string, fallback: number): number {
  const rate = value == null ? fallback : readNumber(value, name, 100);
  if (Math.round(rate * 100) !== rate * 100) {
    throw new Error(`${name} can have at most two decimal places`);
  }
  return rate;
}

function roundTaxCents(taxableCents: number, rate: number): number {
  return Math.round((taxableCents * Math.round(rate * 100)) / 10_000);
}

export function calculateInvoiceAmounts(
  rawItems: unknown,
  defaults: { taxType: string; cgstRate: number; sgstRate: number; igstRate: number }
): { items: NormalizedInvoiceItem[]; amount: number; total: number } {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 500) {
    throw new Error("At least one and no more than 500 invoice items are required");
  }

  let subtotalCents = 0;
  let taxCents = 0;

  const items = rawItems.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error(`Invoice item ${index + 1} is invalid`);
    const item = raw as Record<string, unknown>;
    const quantity = readNumber(item.quantity, `Quantity on item ${index + 1}`, 1_000_000);
    const price = readNumber(item.price, `Rate on item ${index + 1}`, 9_999_999_999.99);
    const taxableCents = Math.round(quantity * price * 100);
    if (!Number.isSafeInteger(taxableCents) || taxableCents > MAX_MONEY_CENTS) {
      throw new Error(`Taxable value on item ${index + 1} is out of range`);
    }
    subtotalCents += taxableCents;

    const taxType =
      typeof item.gstType === "string" && item.gstType
        ? item.gstType
        : defaults.taxType;
    if (!["CGST_SGST", "IGST", "WITHOUT_GST"].includes(taxType)) {
      throw new Error(`GST type on item ${index + 1} is invalid`);
    }

    const cgstRate = readRate(item.cgstRate, "CGST rate", defaults.cgstRate);
    const sgstRate = readRate(item.sgstRate, "SGST rate", defaults.sgstRate);
    const igstRate = readRate(item.igstRate, "IGST rate", defaults.igstRate);
    if (taxType === "CGST_SGST") {
      taxCents += roundTaxCents(taxableCents, cgstRate);
      taxCents += roundTaxCents(taxableCents, sgstRate);
    } else if (taxType === "IGST") {
      taxCents += roundTaxCents(taxableCents, igstRate);
    }

    const text = (key: string, maxLength: number): string | null => {
      const value = item[key];
      if (value == null || value === "") return null;
      if (typeof value !== "string" || value.length > maxLength) {
        throw new Error(`${key} on item ${index + 1} is invalid`);
      }
      return value;
    };

    const unit = text("unit", 10) || text("per", 10) || "Pcs";
    return {
      description: text("description", 255),
      hsn: text("hsn", 20),
      sac: text("sac", 20),
      quantity,
      unit,
      price,
      per: text("per", 10) || unit,
      amount: taxableCents / 100,
      gstType: taxType,
      igstRate: taxType === "IGST" ? igstRate : null,
      cgstRate: taxType === "CGST_SGST" ? cgstRate : null,
      sgstRate: taxType === "CGST_SGST" ? sgstRate : null,
    };
  });

  if (
    subtotalCents > MAX_MONEY_CENTS ||
    taxCents > MAX_MONEY_CENTS ||
    subtotalCents + taxCents > MAX_MONEY_CENTS
  ) {
    throw new Error("Invoice total is out of range");
  }

  return {
    items,
    amount: subtotalCents / 100,
    total: Math.round((subtotalCents + taxCents) / 100),
  };
}
