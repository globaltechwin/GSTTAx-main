import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "to-companies");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const toCompany = await prisma.toCompany.findFirst({
      where: { id: parseInt(id), ...workspaceWhere(access.user) },
      include: {
        invoices: true,
        workspace: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
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
  const access = await requireApiAccess(request, "to-companies", "update");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, gstNo, vendorCode, email, address, state, stateCode, date } = body;
    if (typeof name !== "string" || !name.trim() || typeof date !== "string" || Number.isNaN(new Date(date).getTime())) {
      return NextResponse.json({ error: "A valid company name and date are required" }, { status: 400 });
    }

    const updated = await prisma.toCompany.updateMany({
      where: { id: parseInt(id), adminId: access.user.workspaceId },
      data: {
        name: name.trim(),
        gstNo: typeof gstNo === "string" && gstNo.trim() ? gstNo.trim() : null,
        vendorCode: typeof vendorCode === "string" && vendorCode.trim() ? vendorCode.trim() : null,
        email: typeof email === "string" && email.trim() ? email.trim() : null,
        address: typeof address === "string" && address.trim() ? address.trim() : null,
        state: typeof state === "string" && state.trim() ? state.trim() : null,
        stateCode: typeof stateCode === "string" && stateCode.trim() ? stateCode.trim() : null,
        date: new Date(date),
      },
    });
    if (!updated.count) return NextResponse.json({ error: "To Company not found" }, { status: 404 });
    const toCompany = await prisma.toCompany.findFirst({
      where: { id: parseInt(id), adminId: access.user.workspaceId },
    });

    return NextResponse.json(toCompany);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update to-company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireApiAccess(request, "to-companies", "delete");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const result = await prisma.toCompany.deleteMany({
      where: { id: parseInt(id), adminId: access.user.workspaceId },
    });
    if (!result.count) return NextResponse.json({ error: "To Company not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete to-company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
