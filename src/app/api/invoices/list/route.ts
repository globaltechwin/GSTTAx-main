import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "invoices");
  if (access instanceof NextResponse) return access;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { ...workspaceWhere(access.user) };
    if (search) {
      where.OR = [
        { orderId: { contains: search } },
        { invoiceNo: { contains: search } },
        { billToName: { contains: search } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderId: true,
        invoiceNo: true,
        date: true,
        gst: true,
        amount: true,
        total: true,
        cgstRate: true,
        sgstRate: true,
        igstRate: true,
        billToName: true,
        billToGstin: true,
        billToState: true,
        billToAddress: true,
        company: { select: { name: true } },
        toCompany: { select: { name: true, gstNo: true, state: true } },
        workspace: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
