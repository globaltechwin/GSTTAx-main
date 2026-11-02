import { NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const access = await requireApiAccess(request, "invoices");
  if (access instanceof NextResponse) return access;
  try {
    const where = workspaceWhere(access.user);
    const [totalInvoices, totalAmount] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({ where, _sum: { amount: true, total: true } }),
      prisma.invoice.aggregate({ where, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      totalInvoices,
      totalAmount: Number(totalAmount._sum.total) || 0,
      totalRevenue: Number(totalAmount._sum.amount) || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
