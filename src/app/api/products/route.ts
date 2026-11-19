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
    if (params.get("activeOnly") === "true") where.status = "active";
    if (search) {
      const codeMatch = /^PRD-(\d+)$/i.exec(search);
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { hsnCode: { contains: search } },
        ...(codeMatch ? [{ productNumber: Number(codeMatch[1]) }] : []),
      ];
    }
    const data = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
    return NextResponse.json({ data: data.map((product) => ({ ...product, productCode: `PRD-${String(product.productNumber).padStart(4, "0")}` })) });
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
    const adminId = access.user.workspaceId!;
    let product: Awaited<ReturnType<typeof prisma.product.create>> | null = null;

    // Reuse the lowest available display number in this workspace. The database
    // primary key remains an independent, never-reused auto-increment ID.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const existing = await prisma.product.findMany({ where: { adminId }, select: { productNumber: true } });
      const usedNumbers = new Set(existing.map((item) => item.productNumber));
      let productNumber = 1;
      while (usedNumbers.has(productNumber)) productNumber += 1;

      try {
        product = await prisma.product.create({ data: { adminId, productNumber, name, sku, hsnCode: body.hsnCode || null, description: body.description || null, unit: body.unit || "Nos", gstRate, purchaseRate: toNumber(body.purchaseRate), sellingRate: toNumber(body.sellingRate), stock, minStock: toNumber(body.minStock), status: body.status === "inactive" ? "inactive" : "active" } });
        break;
      } catch (error) {
        const dbError = error as { code?: string; meta?: { target?: unknown } };
        const target = Array.isArray(dbError.meta?.target) ? dbError.meta?.target.join(" ") : String(dbError.meta?.target ?? "");
        if (dbError.code !== "P2002" || !/product.?number/i.test(target)) throw error;
        // Another simultaneous create claimed this number; recalculate and retry.
      }
    }
    if (!product) throw new Error("Could not allocate a product number. Please try again.");
    return NextResponse.json({ ...product, productCode: `PRD-${String(product.productNumber).padStart(4, "0")}` }, { status: 201 });
  } catch (error) { const message = error instanceof Error ? error.message : "Failed to create product"; return NextResponse.json({ error: message.includes("Unique constraint") ? "This SKU already exists in your workspace" : message }, { status: 400 }); }
}
