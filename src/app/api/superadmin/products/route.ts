import { NextRequest, NextResponse } from "next/server";
import { requireSuperadminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;

  const rawAdminId = request.nextUrl.searchParams.get("adminId");
  const adminId = Number(rawAdminId);

  if (!rawAdminId || !Number.isSafeInteger(adminId) || adminId <= 0) {
    return NextResponse.json(
      { error: "Select an Admin workspace to view its products" },
      { status: 400 }
    );
  }

  try {
    const workspace = await prisma.user.findFirst({
      where: { id: adminId, role: { in: ["admin", "ADMIN"] } },
      select: { id: true, firstName: true, lastName: true, username: true, status: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Admin workspace not found" }, { status: 404 });
    }

    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
    const products = await prisma.product.findMany({
      where: {
        adminId,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { sku: { contains: search } },
                { hsnCode: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        name: true,
        sku: true,
        hsnCode: true,
        description: true,
        unit: true,
        gstRate: true,
        purchaseRate: true,
        sellingRate: true,
        stock: true,
        minStock: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      workspace,
      data: products,
      total: products.length,
    });
  } catch (error) {
    console.error("Superadmin product lookup failed", error);
    return NextResponse.json({ error: "Failed to load workspace products" }, { status: 500 });
  }
}
