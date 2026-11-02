import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { purchaseSchema } from "@/lib/validations";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "purchases");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const purchase = await prisma.purchase.findFirst({
      where: { id: parseInt(id), ...workspaceWhere(access.user) },
      include: {
        workspace: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

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
  const access = await requireApiAccess(request, "purchases", "update");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const parsedId = Number(id);
    if (!Number.isSafeInteger(parsedId) || parsedId < 1) {
      return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
    }
    const parsed = purchaseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid purchase data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { gstNo, partyName, invoiceNo, invoiceDate, state, rate, taxableValue, igst, cgst, sgst } =
      parsed.data;
    if (Number.isNaN(new Date(invoiceDate).getTime())) {
      return NextResponse.json({ error: "Invalid purchase date" }, { status: 400 });
    }
    const totalCents =
      Math.round(taxableValue * 100) +
      Math.round((igst ?? 0) * 100) +
      Math.round((cgst ?? 0) * 100) +
      Math.round((sgst ?? 0) * 100);
    if (!Number.isSafeInteger(totalCents)) {
      return NextResponse.json({ error: "Purchase total is out of range" }, { status: 400 });
    }

    const updated = await prisma.purchase.updateMany({
      where: { id: parsedId, adminId: access.user.workspaceId },
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
        totalAmount: totalCents / 100,
      },
    });
    if (!updated.count) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    const purchase = await prisma.purchase.findFirst({
      where: { id: parsedId, adminId: access.user.workspaceId },
    });

    return NextResponse.json(purchase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "purchases", "delete");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const parsedId = Number(id);
    if (!Number.isSafeInteger(parsedId) || parsedId < 1) {
      return NextResponse.json({ error: "Invalid purchase ID" }, { status: 400 });
    }
    const result = await prisma.purchase.deleteMany({
      where: { id: parsedId, adminId: access.user.workspaceId },
    });
    if (!result.count) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
