import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const dateValue = (value: unknown) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "delivery-challans", "view");
  if (access instanceof NextResponse) return access;
  const { id } = await context.params;
  const record = await prisma.deliveryChallan.findFirst({ where: { id: Number(id), ...workspaceWhere(access.user) }, include: { items: true, workspace: { select: { id: true, username: true } } } });
  if (!record) return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "delivery-challans", "update");
  if (access instanceof NextResponse) return access;
  const { id } = await context.params;
  try {
    const existing = await prisma.deliveryChallan.findFirst({ where: { id: Number(id), ...workspaceWhere(access.user) }, include: { items: true } });
    if (!existing) return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 });
    const body = await request.json();
    if (body.action === "cancel") {
      if (existing.status !== "ISSUED") return NextResponse.json({ error: "Only issued challans can be cancelled" }, { status: 409 });
      if (!clean(body.reason)) return NextResponse.json({ error: "Cancellation reason is required" }, { status: 400 });
      const cancelled = await prisma.deliveryChallan.update({ where: { id: existing.id }, data: { status: "CANCELLED", cancelReason: clean(body.reason) }, include: { items: true } });
      return NextResponse.json(cancelled);
    }
    if (existing.status !== "DRAFT") return NextResponse.json({ error: "Only draft challans can be edited" }, { status: 409 });
    const items = Array.isArray(body.items) ? body.items : [];
    if (!clean(body.challanNumber) || !clean(body.recipientName) || !dateValue(body.challanDate) || !items.length) return NextResponse.json({ error: "Required challan details and at least one item are needed" }, { status: 400 });
    const duplicate = await prisma.deliveryChallan.findFirst({ where: { adminId: existing.adminId, challanNumber: clean(body.challanNumber), NOT: { id: existing.id } } });
    if (duplicate) return NextResponse.json({ error: "This challan number already exists" }, { status: 409 });
    if (items.some((item: any) => !clean(item.description) || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      return NextResponse.json({ error: "Every item needs a description and a quantity greater than zero" }, { status: 400 });
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.deliveryChallanItem.deleteMany({ where: { deliveryChallanId: existing.id } });
      return tx.deliveryChallan.update({ where: { id: existing.id }, data: {
        challanNumber: clean(body.challanNumber), challanDate: dateValue(body.challanDate)!, deliveryDate: dateValue(body.deliveryDate),
        companyName: clean(body.companyName), companyAddress: clean(body.companyAddress) || null, companyGstin: clean(body.companyGstin) || null, companyPhone: clean(body.companyPhone) || null,
        recipientName: clean(body.recipientName), recipientAddress: clean(body.recipientAddress) || null, recipientGstin: clean(body.recipientGstin) || null, recipientState: clean(body.recipientState) || null,
        poNumber: clean(body.poNumber) || null, poDate: dateValue(body.poDate), currency: clean(body.currency) || "INR", stateOfSupply: clean(body.stateOfSupply) || null,
        vehicleNumber: clean(body.vehicleNumber) || null, transporterName: clean(body.transporterName) || null, reason: clean(body.reason) || null, remarks: clean(body.remarks) || null,
        items: { create: items.map((item: any) => ({ description: clean(item.description), hsn: clean(item.hsn) || null, quantity: String(item.quantity), uom: clean(item.uom) || "Pcs" })) },
        ...(body.issueNow ? { status: "ISSUED" } : {}),
      }, include: { items: true } });
    });
    return NextResponse.json(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Delivery challan update failed", error);
    return NextResponse.json({ error: "Unable to update delivery challan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "delivery-challans", "delete");
  if (access instanceof NextResponse) return access;
  const { id } = await context.params;
  const record = await prisma.deliveryChallan.findFirst({ where: { id: Number(id), ...workspaceWhere(access.user) } });
  if (!record) return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 });
  if (record.status !== "DRAFT") return NextResponse.json({ error: "Only draft challans can be deleted. Cancel issued challans instead." }, { status: 409 });
  await prisma.deliveryChallan.delete({ where: { id: record.id } });
  return NextResponse.json({ success: true });
}
