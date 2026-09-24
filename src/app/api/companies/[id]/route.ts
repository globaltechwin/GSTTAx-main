import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: { invoices: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, gstNo, email, date, status, ssiNo, panNo, phone, esiNo, address, epfNo } = body;

    const company = await prisma.company.update({
      where: { id: parseInt(id) },
      data: {
        name,
        gstNo: gstNo || null,
        email: email || null,
        date: new Date(date),
        status,
        ssiNo: ssiNo || null,
        panNo: panNo || null,
        phone: phone || null,
        esiNo: esiNo || null,
        address: address || null,
        epfNo: epfNo || null,
      },
    });

    return NextResponse.json(company);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.company.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
