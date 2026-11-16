import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculatePurchaseOrder } from "@/lib/purchase-order-tax";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const access = await requireApiAccess(request, "purchase-orders");
  if (access instanceof NextResponse) return access;
  const id = Number((await params).id);
  const row = await prisma.purchaseOrder.findFirst({ where: { id, ...workspaceWhere(access.user) }, include: { items: { include: { product: { select: { id: true, sku: true } } } }, vendor: true, company: true, inventoryMovements: { include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { createdAt: "asc" } } } });
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
    const nextStatus = body.status.toUpperCase();
    if (!["DRAFT", "APPROVED", "RECEIVED", "CLOSED", "CANCELLED"].includes(nextStatus)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    if (nextStatus === "RECEIVED") {
      if (row.status === "RECEIVED") return NextResponse.json({ error: "This purchase order has already been received. Stock was not changed again." }, { status: 409 });
      if (row.status !== "APPROVED") return NextResponse.json({ error: "Only an Approved purchase order can be marked Received. Draft and Cancelled orders cannot update stock." }, { status: 409 });
      try {
        const received = await prisma.$transaction(async (tx) => {
          const current = await tx.purchaseOrder.findFirst({ where: { id, ...workspaceWhere(access.user) }, include: { items: true } });
          if (!current) throw new Error("Purchase order not found");
          if (current.status !== "APPROVED") throw new Error(current.status === "RECEIVED" ? "This purchase order has already been received" : "Only an Approved purchase order can be received");
          if (!current.items.length) throw new Error("This purchase order has no items to receive");
          for (const item of current.items) {
            if (item.itemType !== "GOODS") continue;
            if (!item.productId) throw new Error(`Link '${item.productName}' to a Product Master item before receiving this order`);
            const product = await tx.product.findFirst({ where: { id: item.productId, adminId: access.user.workspaceId } });
            if (!product) throw new Error(`Product for '${item.productName}' was not found in this workspace`);
            if (await tx.inventoryMovement.findUnique({ where: { purchaseOrderItemId: item.id } })) throw new Error(`Stock receipt already exists for '${item.productName}'`);
            const quantity = Number(item.quantity);
            if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(`Invalid received quantity for '${item.productName}'`);
            const updatedProduct = await tx.product.update({ where: { id: product.id }, data: { stock: { increment: quantity } } });
            const after = Number(updatedProduct.stock);
            const before = after - quantity;
            await tx.inventoryMovement.create({ data: { productId: product.id, purchaseOrderId: id, purchaseOrderItemId: item.id, adminId: access.user.workspaceId!, movementType: "PURCHASE_RECEIPT", quantity, stockBefore: before, stockAfter: after } });
          }
          return tx.purchaseOrder.update({ where: { id }, data: { status: "RECEIVED", receivedAt: new Date() }, include: { items: true } });
        });
        return NextResponse.json(received);
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to receive purchase order" }, { status: 409 });
      }
    }
    if (row.status === "RECEIVED") return NextResponse.json({ error: "A Received purchase order cannot be moved to another status" }, { status: 409 });
    if (row.status === "CANCELLED" && nextStatus !== "CANCELLED") return NextResponse.json({ error: "A Cancelled purchase order cannot be reopened" }, { status: 409 });
    if (nextStatus === "APPROVED" && row.status !== "DRAFT") return NextResponse.json({ error: "Only Draft purchase orders can be approved" }, { status: 409 });
    if (nextStatus === "CANCELLED" && row.status === "RECEIVED") return NextResponse.json({ error: "A Received purchase order cannot be cancelled" }, { status: 409 });
    const updated = await prisma.purchaseOrder.update({ where: { id }, data: { status: nextStatus } });
    return NextResponse.json(updated);
  }
  if (row.status !== "DRAFT") return NextResponse.json({ error: "Only draft purchase orders can be edited" }, { status: 409 });

  try {
    const requestedPoNumber = String(body.poNumber ?? "").trim();
    if (!requestedPoNumber) return NextResponse.json({ error: "Purchase order number is required" }, { status: 400 });
    const duplicatePo = await prisma.purchaseOrder.findFirst({ where: { adminId: row.adminId, poNumber: requestedPoNumber, NOT: { id } }, select: { id: true } });
    if (duplicatePo) return NextResponse.json({ error: `Purchase order number "${requestedPoNumber}" already exists. Please enter a different number.` }, { status: 409 });
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

    const updated = await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          vendorId, poNumber: requestedPoNumber, vendorName: vendor.name, gstin: vendor.gstin, contactName: body.contactName || null,
          orderDate: new Date(body.orderDate), quoteNo: body.quoteNo || null,
          quoteDate: body.quoteDate ? new Date(body.quoteDate) : null, currency: body.currency || vendor.currency,
          shippingAddress: body.shippingAddress || null, senderDetails: body.senderDetails || null, companyId: company.id,
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
