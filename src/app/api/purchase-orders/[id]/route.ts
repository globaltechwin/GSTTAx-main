import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculatePurchaseOrder } from "@/lib/purchase-order-tax";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const access = await requireApiAccess(request, "purchase-orders");
  if (access instanceof NextResponse) return access;
  const id = Number((await params).id);
  const row = await prisma.purchaseOrder.findFirst({ where: { id, ...workspaceWhere(access.user) }, include: { items: true, vendor: true } });
  return row ? NextResponse.json(row) : NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const access = await requireApiAccess(request, "purchase-orders", "update");
  if (access instanceof NextResponse) return access;
  const id = Number((await params).id);
  const row = await prisma.purchaseOrder.findFirst({ where: { id, ...workspaceWhere(access.user) } });
  if (!row) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });

  const body = await request.json();
  if (typeof body.status === "string") {
    if (!["DRAFT", "APPROVED", "CLOSED", "CANCELLED"].includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const updated = await prisma.purchaseOrder.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json(updated);
  }
  if (row.status !== "DRAFT") return NextResponse.json({ error: "Only draft purchase orders can be edited" }, { status: 409 });

  try {
    const vendorId = Number(body.vendorId);
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, ...workspaceWhere(access.user) } });
    if (!vendor) return NextResponse.json({ error: "Select a valid vendor from your workspace" }, { status: 400 });
    const company = await prisma.company.findFirst({ where: workspaceWhere(access.user), select: { state: true } });
    const totals = calculatePurchaseOrder(body.items, company?.state, vendor.state, body.cessAmount);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          vendorId, vendorName: vendor.name, gstin: vendor.gstin, contactName: body.contactName || null,
          orderDate: new Date(body.orderDate), quoteNo: body.quoteNo || null,
          quoteDate: body.quoteDate ? new Date(body.quoteDate) : null, currency: body.currency || vendor.currency,
          shippingAddress: body.shippingAddress || null, senderDetails: body.senderDetails || null,
          subtotal: totals.subtotal, discountAmount: totals.discountAmount, igstAmount: totals.igstAmount,
          cgstAmount: totals.cgstAmount, sgstAmount: totals.sgstAmount, cessAmount: totals.cessAmount,
          grandTotal: totals.grandTotal, items: { create: totals.items },
        },
        include: { items: true },
      });
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update purchase order" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const access = await requireApiAccess(request, "purchase-orders", "delete");
  if (access instanceof NextResponse) return access;
  const id = Number((await params).id);
  const row = await prisma.purchaseOrder.findFirst({ where: { id, ...workspaceWhere(access.user) } });
  if (!row) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
  if (row.status !== "DRAFT") return NextResponse.json({ error: "Only draft purchase orders can be deleted" }, { status: 409 });
  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
