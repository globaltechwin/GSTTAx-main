import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculatePurchaseOrder } from "@/lib/purchase-order-tax";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "purchase-orders");
  if (access instanceof NextResponse) return access;
  try {
    const params = request.nextUrl.searchParams;
    const search = params.get("search") || "";
    const status = params.get("status") || "all";
    const vendorId = Number(params.get("vendorId") || 0);
    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") || 15)));
    const where: Record<string, unknown> = { ...workspaceWhere(access.user) };
    if (search) where.OR = [{ poNumber: { contains: search } }, { vendorName: { contains: search } }, { quoteNo: { contains: search } }];
    if (status !== "all") where.status = status;
    if (vendorId) where.vendorId = vendorId;
    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({ where, include: { items: true }, orderBy: { orderDate: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load purchase orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "purchase-orders", "create");
  if (access instanceof NextResponse) return access;
  try {
    const body = await request.json();
    const vendorId = Number(body.vendorId);
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, ...workspaceWhere(access.user) } });
    if (!vendor) return NextResponse.json({ error: "Select a valid vendor from your workspace" }, { status: 400 });
    const companyId = Number(body.companyId);
    const company = Number.isInteger(companyId) && companyId > 0
      ? await prisma.company.findFirst({ where: { id: companyId, ...workspaceWhere(access.user) }, select: { id: true, state: true } })
      : null;
    if (!company) return NextResponse.json({ error: "Select a valid company from your workspace" }, { status: 400 });
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const linkedItems = await Promise.all(rawItems.map(async (item: Record<string, unknown>) => {
      const sku = String(item.productSku || "").trim();
      if (!sku) return { ...item, productId: null };
      const product = await prisma.product.findFirst({ where: { sku, adminId: access.user.workspaceId, status: "active" }, select: { id: true } });
      if (!product) throw new Error(`Inventory SKU "${sku}" was not found in your active Product Management list`);
      if (item.itemType && String(item.itemType).toUpperCase() !== "GOODS") throw new Error("Inventory SKU can only be linked to Goods items");
      return { ...item, productId: product.id, itemType: "GOODS" };
    }));
    const totals = calculatePurchaseOrder(linkedItems, company.state, vendor.state, body.cessAmount);
    const productIds = [...new Set(totals.items.map((item) => item.productId).filter((id): id is number => id !== null))];
    if (productIds.length) {
      const owned = await prisma.product.count({ where: { id: { in: productIds }, adminId: access.user.workspaceId } });
      if (owned !== productIds.length) return NextResponse.json({ error: "One or more selected products do not belong to this workspace" }, { status: 400 });
    }
    const result = await prisma.purchaseOrder.create({
      data: {
        adminId: access.user.workspaceId!, poNumber: `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
        vendorId, vendorName: vendor.name, gstin: vendor.gstin, contactName: body.contactName || null,
        orderDate: new Date(body.orderDate || new Date()), quoteNo: body.quoteNo || null,
        quoteDate: body.quoteDate ? new Date(body.quoteDate) : null, currency: body.currency || vendor.currency,
        shippingAddress: body.shippingAddress || null, senderDetails: body.senderDetails || null, companyId: company.id,
        subtotal: totals.subtotal, discountAmount: totals.discountAmount, igstAmount: totals.igstAmount,
        cgstAmount: totals.cgstAmount, sgstAmount: totals.sgstAmount, cessAmount: totals.cessAmount,
        grandTotal: totals.grandTotal, items: { create: totals.items },
      },
      include: { items: true },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create purchase order" }, { status: 400 });
  }
}
