import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const dateValue = (value: unknown) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "delivery-challans", "view");
  if (access instanceof NextResponse) return access;
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const status = request.nextUrl.searchParams.get("status") || "all";
    const fromDate = request.nextUrl.searchParams.get("fromDate") || "";
    const toDate = request.nextUrl.searchParams.get("toDate") || "";
    const exportCsv = request.nextUrl.searchParams.get("format") === "csv";
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize") || 10)));
    const where: Record<string, unknown> = { ...workspaceWhere(access.user) };
    if (status !== "all") where.status = status.toUpperCase();
    if (fromDate || toDate) {
      const challanDate: Record<string, Date> = {};
      if (fromDate) challanDate.gte = dateValue(fromDate)!;
      if (toDate) challanDate.lte = new Date(`${toDate.slice(0, 10)}T23:59:59.999Z`);
      where.challanDate = challanDate;
    }
    if (search) where.OR = [
      { challanNumber: { contains: search } },
      { recipientName: { contains: search } },
      { recipientGstin: { contains: search } },
      { poNumber: { contains: search } },
    ];
    if (exportCsv) {
      const records = await prisma.deliveryChallan.findMany({ where, include: { items: true }, orderBy: [{ challanDate: "desc" }, { id: "desc" }] });
      const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const lines = [["Challan No", "Challan Date", "Recipient", "Recipient GSTIN", "PO No", "PO Date", "State of Supply", "Company", "Company GSTIN", "Status", "Item Description", "HSN", "Quantity", "UOM"]];
      for (const record of records) {
        if (!record.items.length) lines.push([record.challanNumber, record.challanDate.toISOString().slice(0, 10), record.recipientName, record.recipientGstin || "", record.poNumber || "", record.poDate?.toISOString().slice(0, 10) || "", record.stateOfSupply || "", record.companyName, record.companyGstin || "", record.status, "", "", "", ""]);
        for (const item of record.items) lines.push([record.challanNumber, record.challanDate.toISOString().slice(0, 10), record.recipientName, record.recipientGstin || "", record.poNumber || "", record.poDate?.toISOString().slice(0, 10) || "", record.stateOfSupply || "", record.companyName, record.companyGstin || "", record.status, item.description, item.hsn || "", item.quantity, item.uom]);
      }
      const csv = lines.map(row => row.map(quote).join(",")).join("\r\n");
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="delivery-challans-${new Date().toISOString().slice(0,10)}.csv"`, "Cache-Control": "no-store" } });
    }
    const [data, total, issued, drafts] = await Promise.all([
      prisma.deliveryChallan.findMany({ where, include: { items: true, workspace: { select: { id: true, username: true, firstName: true, lastName: true } } }, orderBy: [{ challanDate: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.deliveryChallan.count({ where }),
      prisma.deliveryChallan.count({ where: { ...workspaceWhere(access.user), status: "ISSUED" } }),
      prisma.deliveryChallan.count({ where: { ...workspaceWhere(access.user), status: "DRAFT" } }),
    ]);
    return NextResponse.json({ data, total, page, pageSize, stats: { total, issued, drafts } });
  } catch (error) {
    console.error("Delivery challan list failed", error);
    return NextResponse.json({ error: "Unable to load delivery challans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "delivery-challans", "create");
  if (access instanceof NextResponse) return access;
  try {
    const body = await request.json();
    const challanNumber = clean(body.challanNumber);
    const recipientName = clean(body.recipientName);
    const challanDate = dateValue(body.challanDate);
    const items = Array.isArray(body.items) ? body.items : [];
    if (!challanNumber || !recipientName || !challanDate || !items.length) {
      return NextResponse.json({ error: "Challan number, challan date, recipient and at least one item are required" }, { status: 400 });
    }
    if (items.some((item: any) => !clean(item.description) || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0)) {
      return NextResponse.json({ error: "Every item needs a description and a quantity greater than zero" }, { status: 400 });
    }
    const adminId = access.user.workspaceId!;
    const company = body.companyId ? await prisma.company.findFirst({ where: { id: Number(body.companyId), adminId } }) : null;
    const recipient = body.recipientId ? await prisma.toCompany.findFirst({ where: { id: Number(body.recipientId), adminId } }) : null;
    if (body.companyId && !company) return NextResponse.json({ error: "Selected company was not found in this workspace" }, { status: 400 });
    if (body.recipientId && !recipient) return NextResponse.json({ error: "Selected recipient was not found in this workspace" }, { status: 400 });
    const duplicate = await prisma.deliveryChallan.findFirst({ where: { adminId, challanNumber } });
    if (duplicate) return NextResponse.json({ error: "This challan number already exists in your workspace" }, { status: 409 });
    const created = await prisma.deliveryChallan.create({ data: {
      adminId, challanNumber, challanDate, deliveryDate: dateValue(body.deliveryDate),
      companyId: company?.id ?? null, companyName: company?.name || clean(body.companyName) || "",
      companyAddress: company?.address || clean(body.companyAddress) || null, companyGstin: company?.gstNo || clean(body.companyGstin) || null,
      companyPhone: company?.phone || clean(body.companyPhone) || null,
      recipientId: recipient?.id ?? null, recipientName: recipient?.name || recipientName,
      recipientAddress: recipient?.address || clean(body.recipientAddress) || null,
      recipientGstin: recipient?.gstNo || clean(body.recipientGstin) || null,
      recipientState: recipient?.state || clean(body.recipientState) || null,
      poNumber: clean(body.poNumber) || null, poDate: dateValue(body.poDate), currency: clean(body.currency) || "INR",
      stateOfSupply: clean(body.stateOfSupply) || null, vehicleNumber: clean(body.vehicleNumber) || null,
      transporterName: clean(body.transporterName) || null, reason: clean(body.reason) || null, remarks: clean(body.remarks) || null,
      status: body.issueNow ? "ISSUED" : "DRAFT",
      items: { create: items.map((item: any) => ({ description: clean(item.description), hsn: clean(item.hsn) || null, quantity: String(item.quantity), uom: clean(item.uom) || "Pcs" })) },
    }, include: { items: true } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Delivery challan create failed", error);
    return NextResponse.json({ error: "Unable to save delivery challan" }, { status: 500 });
  }
}
