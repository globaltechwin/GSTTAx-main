import { NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIndianFinancialYear } from "@/lib/invoice-numbering";
import { extractDocumentSequence, financialYearBounds, getDocumentNumberingConfig, formatDocumentNumber, type NumberedDocumentType } from "@/lib/document-numbering";

const moduleFor: Record<NumberedDocumentType, "invoices" | "delivery-challans" | "purchase-orders"> = {
  TAX_INVOICE: "invoices", PROFORMA: "invoices", DELIVERY_CHALLAN: "delivery-challans", PURCHASE_ORDER: "purchase-orders",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawType = url.searchParams.get("documentType") || "TAX_INVOICE";
  if (!Object.hasOwn(moduleFor, rawType)) return NextResponse.json({ error: "Unsupported document type" }, { status: 400 });
  const type = rawType as NumberedDocumentType;
  const access = await requireApiAccess(request, moduleFor[type], "create");
  if (access instanceof NextResponse) return access;
  if (access.user.role === "SUPERADMIN") return NextResponse.json({ error: "Workspace numbering is unavailable in platform read-only views" }, { status: 403 });
  try {
    const dateParam = url.searchParams.get("date");
    const parsed = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? new Date(`${dateParam}T12:00:00+05:30`) : new Date();
    const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    const adminId = access.user.workspaceId!;
    const setting = await prisma.workspaceSetting.findUnique({ where: { adminId_key: { adminId, key: "invoice" } }, select: { value: true } });
    const config = getDocumentNumberingConfig(setting?.value, type);
    const { financialYear, start, end } = financialYearBounds(date);
    let values: string[] = [];
    if (type === "TAX_INVOICE" || type === "PROFORMA") {
      const rows = await prisma.invoice.findMany({ where: { adminId, documentType: type, date: { gte: start, lt: end } }, select: { invoiceNo: true } });
      values = rows.map((row) => row.invoiceNo || "");
    } else if (type === "DELIVERY_CHALLAN") {
      const rows = await prisma.deliveryChallan.findMany({ where: { adminId, challanDate: { gte: start, lt: end } }, select: { challanNumber: true } });
      values = rows.map((row) => row.challanNumber);
    } else {
      const rows = await prisma.purchaseOrder.findMany({ where: { adminId, orderDate: { gte: start, lt: end } }, select: { poNumber: true } });
      values = rows.map((row) => row.poNumber);
    }
    const savedMax = values.reduce((max, value) => Math.max(max, extractDocumentSequence(value, config, financialYear, type)), 0);
    // Preview must use the same live-document rule as final allocation.
    // Deleted highest-numbered documents do not reserve their number.
    const nextValue = Math.max(config.start - 1, savedMax) + 1;
    return NextResponse.json({
      nextNumber: formatDocumentNumber(config, nextValue, date),
      automatic: config.enabled,
      allowManualOverride: !config.enabled || config.allowManualOverride,
      financialYear: getIndianFinancialYear(date),
    });
  } catch (error) {
    console.error("Document number preview failed", error);
    return NextResponse.json({ error: "Unable to generate document number preview" }, { status: 500 });
  }
}
