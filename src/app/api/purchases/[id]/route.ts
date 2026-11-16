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
        items: true,
        company: { select: { id: true, name: true, gstNo: true, panNo: true, phone: true, email: true, address: true, state: true, logoUrl: true, signatureUrl: true, signatureWidth: true, signatureHeight: true } },
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
    const { companyId, gstNo, partyName, invoiceNo, invoiceDate, state, rate, taxableValue, igst, cgst, sgst, items } =
      parsed.data;
    if (companyId) {
      const company = await prisma.company.findFirst({ where: { id: companyId, adminId: access.user.workspaceId, status: "active" }, select: { id: true } });
      if (!company) return NextResponse.json({ error: "Selected company is invalid for this workspace" }, { status: 400 });
    }
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

    const productIds = [...new Set(items.map(item => item.productId).filter((id): id is number => Boolean(id)))];
    if (productIds.length) {
      const validProducts = await prisma.product.count({ where: { id: { in: productIds }, adminId: access.user.workspaceId } });
      if (validProducts !== productIds.length) return NextResponse.json({ error: "One or more selected products are invalid for this workspace" }, { status: 400 });
    }
    const existing = await prisma.purchase.findFirst({ where: { id: parsedId, adminId: access.user.workspaceId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    const updated = await prisma.purchase.update({
      where: { id: parsedId },
      data: {
        companyId: companyId || null,
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
        items: { deleteMany: {}, ...(items.length ? { create: items.map(item => ({ productId: item.productId || null, description: item.description, hsn: item.hsn || null, quantity: item.quantity, unit: item.unit || "Nos", unitPrice: item.unitPrice, gstRate: item.gstRate, taxableValue: item.taxableValue, igst: item.igst ?? 0, cgst: item.cgst ?? 0, sgst: item.sgst ?? 0, totalAmount: item.totalAmount })) } : {}) },
      },
      include: { items: true },
    });
    return NextResponse.json(updated);
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
