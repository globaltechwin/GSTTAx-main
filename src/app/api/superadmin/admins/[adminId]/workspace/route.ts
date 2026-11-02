import { NextRequest, NextResponse } from "next/server";
import { requireSuperadminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ adminId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;
  const rawId = (await params).adminId;
  const adminId = Number(rawId);
  if (!Number.isSafeInteger(adminId) || adminId < 1) {
    return NextResponse.json({ error: "Invalid Admin ID" }, { status: 400 });
  }

  try {
    const admin = await prisma.user.findFirst({
      where: { id: adminId, role: { in: ["admin", "ADMIN"] } },
      select: { id: true, firstName: true, lastName: true, username: true, email: true, phone: true, status: true, createdAt: true },
    });
    if (!admin) return NextResponse.json({ error: "Admin workspace not found" }, { status: 404 });

    const [users, companies, toCompanies, invoices, purchases, referrals, activity, userCount, companyCount, toCompanyCount, invoiceCount, purchaseCount, referralCount] = await Promise.all([
      prisma.user.findMany({ where: { adminId, role: { in: ["user", "USER"] } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, firstName: true, lastName: true, username: true, email: true, status: true, createdAt: true } }),
      prisma.company.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, gstNo: true, email: true, phone: true, address: true, state: true, status: true, createdAt: true } }),
      prisma.toCompany.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, gstNo: true, email: true, state: true, createdAt: true } }),
      prisma.invoice.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, invoiceNo: true, orderId: true, date: true, amount: true, total: true, company: { select: { name: true } }, toCompany: { select: { name: true } } } }),
      prisma.purchase.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, partyName: true, invoiceNo: true, invoiceDate: true, totalAmount: true, gstNo: true } }),
      prisma.referral.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, email: true, mobile: true, createdAt: true } }),
      prisma.auditLog.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 25, include: { actor: { select: { username: true, firstName: true, lastName: true } } } }),
      prisma.user.count({ where: { adminId, role: { in: ["user", "USER"] } } }),
      prisma.company.count({ where: { adminId } }),
      prisma.toCompany.count({ where: { adminId } }),
      prisma.invoice.count({ where: { adminId } }),
      prisma.purchase.count({ where: { adminId } }),
      prisma.referral.count({ where: { adminId } }),
    ]);

    return NextResponse.json({
      admin,
      counts: { users: userCount, companies: companyCount, toCompanies: toCompanyCount, invoices: invoiceCount, purchases: purchaseCount, referrals: referralCount },
      users, companies, toCompanies, invoices, purchases, referrals,
      activity: activity.map((entry) => ({ id: entry.id, action: entry.action, createdAt: entry.createdAt, actor: entry.actor.username, actorName: `${entry.actor.firstName} ${entry.actor.lastName}` })),
      limit: 100,
    });
  } catch (error) {
    console.error("Failed to load workspace explorer", error);
    return NextResponse.json({ error: "Failed to load workspace details" }, { status: 500 });
  }
}
