import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchase = await prisma.purchase.findUnique({ where: { id: parseInt(id) } });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { gstNo, partyName, invoiceNo, invoiceDate, state, rate, taxableValue, igst, cgst, sgst, totalAmount } = body;

    const purchase = await prisma.purchase.update({
      where: { id: parseInt(id) },
      data: {
        gstNo: gstNo || null,
        partyName,
        invoiceNo,
        invoiceDate: new Date(invoiceDate),
        state: state || null,
        rate: rate ?? 0,
        taxableValue: taxableValue ?? 0,
        igst: igst ?? 0,
        cgst: cgst ?? 0,
        sgst: sgst ?? 0,
        totalAmount: totalAmount ?? 0,
      },
    });

    return NextResponse.json(purchase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.purchase.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
