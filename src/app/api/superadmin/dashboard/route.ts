import { NextRequest, NextResponse } from "next/server";
import { requireSuperadminApi, workspaceWhere } from "@/lib/auth";
import { MODULE_KEYS } from "@/lib/permissions";
import { prisma } from "@/lib/db";

function parseModules(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string =>
          typeof item === "string" && (MODULE_KEYS as readonly string[]).includes(item)
        )
      : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;

  try {
    const scope = workspaceWhere(access.user);
    const subordinateScope = { admin: { is: { role: { in: ["admin", "ADMIN"] } } } };
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfToday);
      date.setDate(startOfToday.getDate() - (6 - index));
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      return { date, next };
    });

    const [
      adminCount, activeAdminCount, userCount, activeUserCount,
      companyCount, invoiceCount, proformaInvoiceCount, purchaseCount,
      toCompanyCount, referralCount, vendorCount, purchaseOrderCount,
      deliveryChallanCount, audit, admins, trendRows,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { in: ["admin", "ADMIN"] } } }),
      prisma.user.count({ where: { role: { in: ["admin", "ADMIN"] }, status: "active" } }),
      prisma.user.count({ where: { ...subordinateScope, role: { in: ["user", "USER"] } } }),
      prisma.user.count({ where: { ...subordinateScope, role: { in: ["user", "USER"] }, status: "active" } }),
      prisma.company.count({ where: scope }),
      prisma.invoice.count({ where: { ...scope, documentType: "TAX_INVOICE" } }),
      prisma.invoice.count({ where: { ...scope, documentType: "PROFORMA_INVOICE" } }),
      prisma.purchase.count({ where: scope }),
      prisma.toCompany.count({ where: scope }),
      prisma.referral.count({ where: scope }),
      prisma.vendor.count({ where: scope }),
      prisma.purchaseOrder.count({ where: scope }),
      prisma.deliveryChallan.count({ where: scope }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { actor: { select: { username: true, firstName: true, lastName: true } } },
      }),
      prisma.user.findMany({
        where: { role: { in: ["admin", "ADMIN"] } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, firstName: true, lastName: true, username: true,
          email: true, status: true, createdAt: true, sidebarAccess: true,
          _count: { select: { users: true, companies: true, invoices: true, purchases: true } },
        },
      }),
      Promise.all(days.map(async ({ date, next }) => {
        const [invoices, purchases] = await Promise.all([
          prisma.invoice.count({ where: { ...scope, createdAt: { gte: date, lt: next }, documentType: "TAX_INVOICE" } }),
          prisma.purchase.count({ where: { ...scope, createdAt: { gte: date, lt: next } } }),
        ]);
        return {
          date: date.toISOString(),
          label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          invoices,
          purchases,
        };
      })),
    ]);

    const otherCount = toCompanyCount + referralCount + vendorCount + purchaseOrderCount + deliveryChallanCount + proformaInvoiceCount;
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      adminCount,
      activeAdminCount,
      inactiveAdminCount: adminCount - activeAdminCount,
      userCount,
      activeUserCount,
      inactiveUserCount: userCount - activeUserCount,
      companyCount, invoiceCount, proformaInvoiceCount, purchaseCount,
      toCompanyCount, referralCount, vendorCount, purchaseOrderCount, deliveryChallanCount,
      moduleBreakdown: [
        { key: "companies", label: "Companies", count: companyCount },
        { key: "invoices", label: "Invoices", count: invoiceCount },
        { key: "purchases", label: "Purchases", count: purchaseCount },
        { key: "users", label: "Users", count: userCount },
        { key: "others", label: "Others", count: otherCount },
      ],
      trend: trendRows,
      admins: admins.map(({ sidebarAccess, _count, ...admin }) => ({
        ...admin,
        modules: parseModules(sidebarAccess),
        userCount: _count.users,
        companyCount: _count.companies,
        invoiceCount: _count.invoices,
        purchaseCount: _count.purchases,
      })),
      recentActivity: audit.map((entry) => ({
        id: entry.id,
        action: entry.action,
        targetId: entry.targetId,
        createdAt: entry.createdAt,
        actor: entry.actor.username,
        actorName: `${entry.actor.firstName} ${entry.actor.lastName}`.trim(),
        adminId: entry.adminId,
      })),
    });
  } catch (error) {
    console.error("Failed to load Superadmin dashboard", error);
    return NextResponse.json({ error: "Failed to load platform statistics" }, { status: 500 });
  }
}
