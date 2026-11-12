import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

const toNumber = (value: unknown, fallback = 0) => { const n = Number(value ?? fallback); return Number.isFinite(n) ? n : fallback; };

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "products");
  if (access instanceof NextResponse) return access;
  try {
    const params = request.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const where: any = { adminId: access.user.workspaceId };
    if (search) where.OR = [{ name: { contains: search } }, { sku: { contains: search } }, { hsnCode: { contains: search } }];
    const data = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
    return NextResponse.json({ data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load products" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "products", "create");
  if (access instanceof NextResponse) return access;
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim(); const sku = String(body.sku ?? "").trim();
    if (!name || !sku) return NextResponse.json({ error: "Product name and SKU are required" }, { status: 400 });
    const gstRate = toNumber(body.gstRate); const stock = toNumber(body.stock);
    if (gstRate < 0 || gstRate > 100 || stock < 0) return NextResponse.json({ error: "GST rate must be 0–100 and stock cannot be negative" }, { status: 400 });
    const product = await prisma.product.create({ data: { adminId: access.user.workspaceId!, name, sku, hsnCode: body.hsnCode || null, description: body.description || null, unit: body.unit || "Nos", gstRate, purchaseRate: toNumber(body.purchaseRate), sellingRate: toNumber(body.sellingRate), stock, minStock: toNumber(body.minStock), status: body.status === "inactive" ? "inactive" : "active" } });
    return NextResponse.json(product, { status: 201 });
  } catch (error) { const message = error instanceof Error ? error.message : "Failed to create product"; return NextResponse.json({ error: message.includes("Unique constraint") ? "This SKU already exists in your workspace" : message }, { status: 400 }); }
}
