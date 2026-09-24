import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
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
      },
    });

    return NextResponse.json(invoices);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
