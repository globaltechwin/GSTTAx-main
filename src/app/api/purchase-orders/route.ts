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
    const company = await prisma.company.findFirst({ where: workspaceWhere(access.user), select: { state: true } });
    const totals = calculatePurchaseOrder(body.items, company?.state, vendor.state, body.cessAmount);
    const result = await prisma.purchaseOrder.create({
      data: {
        adminId: access.user.workspaceId!, poNumber: `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
        vendorId, vendorName: vendor.name, gstin: vendor.gstin, contactName: body.contactName || null,
        orderDate: new Date(body.orderDate || new Date()), quoteNo: body.quoteNo || null,
        quoteDate: body.quoteDate ? new Date(body.quoteDate) : null, currency: body.currency || vendor.currency,
        shippingAddress: body.shippingAddress || null, senderDetails: body.senderDetails || null,
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
