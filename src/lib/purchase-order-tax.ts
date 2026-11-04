export type PurchaseOrderInputItem = {
  productName?: unknown; description?: unknown; itemType?: unknown; hsnSac?: unknown;
  quantity?: unknown; uom?: unknown; unitRate?: unknown; discountRate?: unknown;
  taxRate?: unknown; taxType?: unknown;
};
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const numeric = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : Number.NaN;
};
const normalizeState = (value: string | null | undefined) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

export function calculatePurchaseOrder(
  rawItems: PurchaseOrderInputItem[], companyState: string | null | undefined,
  vendorState: string | null | undefined, extraCessValue: unknown = 0,
) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new Error("Add at least one product");
  const company = normalizeState(companyState);
  const vendor = normalizeState(vendorState);
  const isIntraState = !!company && !!vendor && company === vendor;
  const extraCess = numeric(extraCessValue);
  if (!Number.isFinite(extraCess) || extraCess < 0) throw new Error("Cess amount must be zero or a positive number");

  let subtotal = 0, discountAmount = 0, igstAmount = 0, cgstAmount = 0, sgstAmount = 0, itemCessAmount = 0;
  const items = rawItems.map((item) => {
    const quantity = numeric(item.quantity), unitRate = numeric(item.unitRate);
    const discountRate = numeric(item.discountRate), taxRate = numeric(item.taxRate);
    const taxType = String(item.taxType || "AUTO").trim().toUpperCase();
    if (!String(item.productName || "").trim()) throw new Error("Enter a product name for every item");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Product quantity must be greater than zero");
    if (!Number.isFinite(unitRate) || unitRate < 0) throw new Error("Unit rate cannot be negative");
    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) throw new Error("Discount must be between 0 and 100%");
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) throw new Error("GST rate must be between 0 and 100%");
    if (!["AUTO", "IGST", "CGST_SGST", "CGST", "SGST", "CESS", "NONE"].includes(taxType)) throw new Error("Select a valid GST type");
    if (taxType === "IGST" && company && vendor && isIntraState) throw new Error("IGST cannot be selected for a same-state purchase. Select CGST + SGST or Auto.");
    if (taxType === "CGST_SGST" && company && vendor && !isIntraState) throw new Error("CGST + SGST cannot be selected for an interstate purchase. Select IGST or Auto.");

    const grossAmount = money(quantity * unitRate);
    const discount = money(grossAmount * discountRate / 100);
    const taxableAmount = money(grossAmount - discount);
    const calculatedTax = taxType === "NONE" ? 0 : money(taxableAmount * taxRate / 100);
    let itemIgst = 0, itemCgst = 0, itemSgst = 0, itemCess = 0;
    if (taxType === "IGST") itemIgst = calculatedTax;
    else if (taxType === "AUTO" || taxType === "CGST_SGST") {
      if (isIntraState) { itemCgst = money(calculatedTax / 2); itemSgst = money(calculatedTax - itemCgst); }
      else itemIgst = calculatedTax;
    } else if (taxType === "CGST") itemCgst = calculatedTax;
    else if (taxType === "SGST") itemSgst = calculatedTax;
    else if (taxType === "CESS") itemCess = calculatedTax;

    const lineTax = money(itemIgst + itemCgst + itemSgst + itemCess);
    const totalAmount = money(taxableAmount + lineTax);
    subtotal = money(subtotal + grossAmount);
    discountAmount = money(discountAmount + discount);
    igstAmount = money(igstAmount + itemIgst);
    cgstAmount = money(cgstAmount + itemCgst);
    sgstAmount = money(sgstAmount + itemSgst);
    itemCessAmount = money(itemCessAmount + itemCess);
    return {
      productName: String(item.productName).trim(), description: String(item.description || "") || null,
      itemType: String(item.itemType || "GOODS"), hsnSac: String(item.hsnSac || "") || null,
      quantity, uom: String(item.uom || "Nos"), unitRate, discountRate, taxRate, taxType,
      taxableAmount, taxAmount: lineTax, totalAmount,
    };
  });
  const regularTaxAmount = money(igstAmount + cgstAmount + sgstAmount);
  const cessAmount = money(itemCessAmount + extraCess);
  const grandTotal = money(subtotal - discountAmount + regularTaxAmount + cessAmount);
  return { items, subtotal, discountAmount, igstAmount, cgstAmount, sgstAmount,
    regularTaxAmount, itemCessAmount, extraCessAmount: money(extraCess), cessAmount, grandTotal, isIntraState };
}
