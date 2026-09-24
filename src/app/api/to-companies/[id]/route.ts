import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const toCompany = await prisma.toCompany.findUnique({
      where: { id: parseInt(id) },
      include: { invoices: true },
    });

    if (!toCompany) {
      return NextResponse.json({ error: "To Company not found" }, { status: 404 });
    }

    return NextResponse.json(toCompany);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch to-company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, gstNo, vendorCode, date } = body;

    const toCompany = await prisma.toCompany.update({
      where: { id: parseInt(id) },
      data: {
        name,
        gstNo: gstNo || null,
        vendorCode: vendorCode || null,
        date: new Date(date),
      },
    });

    return NextResponse.json(toCompany);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update to-company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.toCompany.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete to-company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
