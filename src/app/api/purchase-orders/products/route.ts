import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "purchase-orders");
  if (access instanceof NextResponse) return access;
  const data = await prisma.product.findMany({ where: { adminId: access.user.workspaceId, status: "active" }, orderBy: { name: "asc" }, take: 500, select: { id: true, name: true, sku: true, hsnCode: true, unit: true, gstRate: true, purchaseRate: true, stock: true } });
  return NextResponse.json({ data });
}
