import { NextRequest, NextResponse } from "next/server";
import { requireSuperadminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MODULE_KEYS } from "@/lib/permissions";

type RouteContext = { params: Promise<{ adminId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;
  const adminId = Number((await params).adminId);
  if (!Number.isSafeInteger(adminId) || adminId < 1) return NextResponse.json({ error: "Invalid Admin ID" }, { status: 400 });

  try {
    const admin = await prisma.user.findFirst({
      where: { id: adminId, role: { in: ["admin", "ADMIN"] } },
      select: { id: true, firstName: true, lastName: true, username: true, email: true, phone: true, status: true, sidebarAccess: true, createdAt: true },
    });
    if (!admin) return NextResponse.json({ error: "Admin workspace not found" }, { status: 404 });

    let modules: string[] = [];
    try {
      const parsed: unknown = JSON.parse(admin.sidebarAccess || "[]");
      if (Array.isArray(parsed)) modules = parsed.filter((value): value is string => typeof value === "string" && (MODULE_KEYS as readonly string[]).includes(value));
    } catch { modules = []; }

    const workspace = { adminId };
    const [users, companies, toCompanies, invoices, purchases, referrals, vendors, purchaseOrders, deliveryChallans, activity,
      userCount, companyCount, toCompanyCount, invoiceCount, proformaCount, purchaseCount, referralCount, vendorCount, purchaseOrderCount, deliveryChallanCount] = await Promise.all([
      prisma.user.findMany({ where: { ...workspace, role: { in: ["user", "USER"] } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, firstName: true, lastName: true, username: true, email: true, status: true, createdAt: true } }),
      prisma.company.findMany({ where: workspace, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, gstNo: true, email: true, phone: true, address: true, state: true, status: true, createdAt: true } }),
      prisma.toCompany.findMany({ where: workspace, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, gstNo: true, email: true, state: true, createdAt: true } }),
      prisma.invoice.findMany({ where: { ...workspace, documentType: "TAX_INVOICE" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, invoiceNo: true, orderId: true, date: true, amount: true, total: true, company: { select: { name: true } }, toCompany: { select: { name: true } } } }),
      prisma.purchase.findMany({ where: workspace, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, partyName: true, invoiceNo: true, invoiceDate: true, totalAmount: true, gstNo: true, state: true } }),
      prisma.referral.findMany({ where: workspace, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, email: true, mobile: true, createdAt: true } }),
      prisma.vendor.findMany({ where: workspace, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, gstin: true, email: true, mobile: true, state: true, status: true, createdAt: true } }),
      prisma.purchaseOrder.findMany({ where: workspace, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, poNumber: true, vendorName: true, gstin: true, orderDate: true, grandTotal: true, status: true } }),
      prisma.deliveryChallan.findMany({ where: workspace, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, challanNumber: true, challanDate: true, recipientName: true, companyName: true, status: true, createdAt: true } }),
      prisma.auditLog.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 25, include: { actor: { select: { username: true, firstName: true, lastName: true } } } }),
      prisma.user.count({ where: { ...workspace, role: { in: ["user", "USER"] } } }), prisma.company.count({ where: workspace }), prisma.toCompany.count({ where: workspace }),
      prisma.invoice.count({ where: { ...workspace, documentType: "TAX_INVOICE" } }), prisma.invoice.count({ where: { ...workspace, documentType: "PROFORMA" } }),
      prisma.purchase.count({ where: workspace }), prisma.referral.count({ where: workspace }), prisma.vendor.count({ where: workspace }), prisma.purchaseOrder.count({ where: workspace }), prisma.deliveryChallan.count({ where: workspace }),
    ]);

    return NextResponse.json({
      admin: { id: admin.id, firstName: admin.firstName, lastName: admin.lastName, username: admin.username, email: admin.email, phone: admin.phone, status: admin.status, createdAt: admin.createdAt },
      modules,
      counts: { users: userCount, companies: companyCount, toCompanies: toCompanyCount, invoices: invoiceCount, proformaInvoices: proformaCount, purchases: purchaseCount, referrals: referralCount, vendors: vendorCount, purchaseOrders: purchaseOrderCount, deliveryChallans: deliveryChallanCount },
      users, companies, toCompanies, invoices, purchases, referrals, vendors, purchaseOrders, deliveryChallans,
      proformaInvoices: await prisma.invoice.findMany({ where: { ...workspace, documentType: "PROFORMA" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, invoiceNo: true, orderId: true, date: true, amount: true, total: true, company: { select: { name: true } }, toCompany: { select: { name: true } } } }),
      activity: activity.map((entry) => ({ id: entry.id, action: entry.action, createdAt: entry.createdAt, actor: entry.actor.username, actorName: `${entry.actor.firstName} ${entry.actor.lastName}` })),
      limit: 100,
    });
  } catch (error) {
    console.error("Failed to load workspace explorer", error);
    return NextResponse.json({ error: "Failed to load workspace details" }, { status: 500 });
  }
}
