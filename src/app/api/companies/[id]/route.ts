import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "companies");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const company = await prisma.company.findFirst({
      where: { id: parseInt(id), ...workspaceWhere(access.user) },
      include: {
        invoices: true,
        workspace: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
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
  const access = await requireApiAccess(request, "companies", "update");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, gstNo, email, date, status, ssiNo, panNo, phone, esiNo, address, epfNo } = body;

    const result = await prisma.company.updateMany({
      where: { id: parseInt(id), adminId: access.user.workspaceId },
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
    if (!result.count) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    const company = await prisma.company.findFirst({
      where: { id: parseInt(id), adminId: access.user.workspaceId },
    });

    return NextResponse.json(company);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireApiAccess(request, "companies", "delete");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const result = await prisma.company.deleteMany({
      where: { id: parseInt(id), adminId: access.user.workspaceId },
    });
    if (!result.count) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
