import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "purchase-orders");
  if (access instanceof NextResponse) return access;
  const params = request.nextUrl.searchParams;
  const productId = Number(params.get("productId") || 0);
  const purchaseOrderId = Number(params.get("purchaseOrderId") || 0);
  const where: Record<string, unknown> = { adminId: access.user.workspaceId };
  if (productId > 0) where.productId = productId;
  if (purchaseOrderId > 0) where.purchaseOrderId = purchaseOrderId;
  const data = await prisma.inventoryMovement.findMany({ where, include: { product: { select: { id: true, name: true, sku: true } }, purchaseOrder: { select: { id: true, poNumber: true, vendorName: true } } }, orderBy: { createdAt: "desc" }, take: 500 });
  return NextResponse.json({ data });
}
