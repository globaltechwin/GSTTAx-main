import { NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  createdAt: Date;
  href: string;
  kind: "company" | "to-company" | "invoice" | "purchase";
}

export async function GET(request: Request) {
  const access = await requireApiAccess(request, "dashboard");
  if (access instanceof NextResponse) return access;
  if (access.user.role === "SUPERADMIN") {
    return NextResponse.json({ error: "Use the platform dashboard endpoint" }, { status: 403 });
  }

  const workspaceId = access.user.workspaceId;
  const isUser = access.user.role === "USER";
  const canView = (module: string) => !isUser || access.user.sidebarAccess.includes(module);
  const canViewCompanies = canView("companies");
  const canViewToCompanies = canView("to-companies");
  const canViewInvoices = canView("invoices");
  const canViewPurchases = canView("purchases");
  const where = { adminId: workspaceId };

  try {
    const [totalCompanies, totalToCompanies, totalInvoices, totalPurchases] = await Promise.all([
      canViewCompanies ? prisma.company.count({ where }) : null,
      canViewToCompanies ? prisma.toCompany.count({ where }) : null,
      canViewInvoices ? prisma.invoice.count({ where }) : null,
      canViewPurchases ? prisma.purchase.count({ where }) : null,
    ]);

    const currentMonth = new Date();
    const monthStarts = Array.from({ length: 8 }, (_, index) => {
      const monthOffset = index - 7;
      return new Date(
        Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + monthOffset, 1)
      );
    });
    const monthly = await Promise.all(
      monthStarts.map(async (start, index) => {
        const end =
          index === monthStarts.length - 1
            ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
            : monthStarts[index + 1];
        const [invoiceStats, purchaseStats] = await Promise.all([
          canViewInvoices
            ? prisma.invoice.aggregate({
                where: { ...where, createdAt: { gte: start, lt: end } },
                _count: { _all: true },
                _sum: { amount: true },
              })
            : null,
          canViewPurchases
            ? prisma.purchase.aggregate({
                where: { ...where, createdAt: { gte: start, lt: end } },
                _count: { _all: true },
                _sum: { totalAmount: true },
              })
            : null,
        ]);
        return {
          month: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(start),
          invoices: invoiceStats?._count._all ?? 0,
          purchases: purchaseStats?._count._all ?? 0,
          revenue: Number(invoiceStats?._sum.amount ?? 0),
        };
      })
    );

    const activityQueries: Promise<ActivityItem[]>[] = [];
    if (canViewCompanies) {
      activityQueries.push(
        prisma.company
          .findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { id: true, name: true, createdAt: true },
          })
          .then((rows) =>
            rows.map((row) => ({
              id: `company-${row.id}`,
              action: "Company added",
              detail: row.name,
              createdAt: row.createdAt,
              href: "/dashboard/companies",
              kind: "company" as const,
            }))
          )
      );
    }
    if (canViewToCompanies) {
      activityQueries.push(
        prisma.toCompany
          .findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { id: true, name: true, createdAt: true },
          })
          .then((rows) =>
            rows.map((row) => ({
              id: `to-company-${row.id}`,
              action: "Customer or vendor added",
              detail: row.name,
              createdAt: row.createdAt,
              href: "/dashboard/to-companies",
              kind: "to-company" as const,
            }))
          )
      );
    }
    if (canViewInvoices) {
      activityQueries.push(
        prisma.invoice
          .findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { id: true, invoiceNo: true, orderId: true, createdAt: true },
          })
          .then((rows) =>
            rows.map((row) => ({
              id: `invoice-${row.id}`,
              action: "Invoice created",
              detail: row.invoiceNo || row.orderId,
              createdAt: row.createdAt,
              href: `/dashboard/invoices/${row.id}`,
              kind: "invoice" as const,
            }))
          )
      );
    }
    if (canViewPurchases) {
      activityQueries.push(
        prisma.purchase
          .findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 4,
            select: { id: true, partyName: true, invoiceNo: true, createdAt: true },
          })
          .then((rows) =>
            rows.map((row) => ({
              id: `purchase-${row.id}`,
              action: "Purchase recorded",
              detail: `${row.partyName} · ${row.invoiceNo}`,
              createdAt: row.createdAt,
              href: "/dashboard/purchases",
              kind: "purchase" as const,
            }))
          )
      );
    }
    const recentActivity = (await Promise.all(activityQueries))
      .flat()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 5)
      .map((activity) => ({ ...activity, createdAt: activity.createdAt.toISOString() }));

    return NextResponse.json({
      username: access.user.firstName || access.user.username,
      totalCompanies,
      totalToCompanies,
      totalInvoices,
      totalPurchases,
      canViewCompanies,
      canViewToCompanies,
      canViewInvoices,
      canViewPurchases,
      monthly,
      recentActivity,
    });
  } catch (error) {
    console.error("Failed to load dashboard data", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
