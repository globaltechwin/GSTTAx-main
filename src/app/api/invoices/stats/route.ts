import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [totalInvoices, totalAmount] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.aggregate({ _sum: { amount: true, total: true } }),
      prisma.invoice.aggregate({ _sum: { amount: true } }),
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
