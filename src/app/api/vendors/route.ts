import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "vendors");
  if (access instanceof NextResponse) return access;
  try {
    const p = request.nextUrl.searchParams;
    const search = p.get("search") || "";
    const status = p.get("status") || "all";
    const state = p.get("state") || "all";
    const page = Math.max(1, Number(p.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(p.get("pageSize") || 15)));
    const where: Record<string, unknown> = { ...workspaceWhere(access.user) };
    if (search) where.OR = ["name", "email", "pan", "gstin", "mobile"].map((field) => ({ [field]: { contains: search } }));
    if (status !== "all") where.status = status;
    if (state !== "all") where.state = state;
    const [data, total] = await Promise.all([
      prisma.vendor.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.vendor.count({ where }),
    ]);
    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load vendors" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "vendors", "create");
  if (access instanceof NextResponse) return access;
  try {
    const b = await request.json();
    if (!String(b.name || "").trim()) return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    const gstin = String(b.gstin || "").trim().toUpperCase() || null;
    if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) return NextResponse.json({ error: "Enter a valid 15-character GSTIN" }, { status: 400 });
    const vendor = await prisma.vendor.create({ data: {
      adminId: access.user.workspaceId!, name: String(b.name).trim(), industry: b.industry || null, email: b.email || null,
      website: b.website || null, landline: b.landline || null, mobile: b.mobile || null, addressLine1: b.addressLine1 || null,
      addressLine2: b.addressLine2 || null, gstnType: b.gstnType || "REGISTERED_REGULAR", gstin, pan: b.pan || null,
      currency: b.currency || "INR", country: b.country || "India", state: b.state || null, pinCode: b.pinCode || null,
      tcsEnabled: Boolean(b.tcsEnabled), tcsRate: Number(b.tcsRate || 0), openingDate: b.openingDate ? new Date(b.openingDate) : null,
      openingType: b.openingType === "DEBIT" ? "DEBIT" : "CREDIT", openingAmount: Number(b.openingAmount || 0), portalEnabled: Boolean(b.portalEnabled),
    } });
    return NextResponse.json(vendor, { status: 201 });
  } catch (error) { const msg = error instanceof Error ? error.message : "Unable to create vendor"; return NextResponse.json({ error: msg.includes("Unique constraint") ? "A vendor with this GSTIN already exists" : msg }, { status: 400 }); }
}
