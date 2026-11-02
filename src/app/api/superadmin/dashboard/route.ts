import { NextRequest, NextResponse } from "next/server";
import { requireSuperadminApi, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;

  try {
    const workspaceScope = workspaceWhere(access.user);
    const subordinateScope = { admin: { is: { role: { in: ["admin", "ADMIN"] } } } };
    const [
      adminCount,
      activeAdminCount,
      userCount,
      activeUserCount,
      companyCount,
      invoiceCount,
      purchaseCount,
      audit,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { in: ["admin", "ADMIN"] } } }),
      prisma.user.count({ where: { role: { in: ["admin", "ADMIN"] }, status: "active" } }),
      prisma.user.count({ where: { ...subordinateScope, role: { in: ["user", "USER"] } } }),
      prisma.user.count({
        where: { ...subordinateScope, role: { in: ["user", "USER"] }, status: "active" },
      }),
      prisma.company.count({ where: workspaceScope }),
      prisma.invoice.count({ where: workspaceScope }),
      prisma.purchase.count({ where: workspaceScope }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          actor: { select: { username: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    return NextResponse.json({
      adminCount,
      activeAdminCount,
      inactiveAdminCount: adminCount - activeAdminCount,
      userCount,
      activeUserCount,
      inactiveUserCount: userCount - activeUserCount,
      companyCount,
      invoiceCount,
      purchaseCount,
      recentActivity: audit.map((entry) => ({
        id: entry.id,
        action: entry.action,
        targetId: entry.targetId,
        createdAt: entry.createdAt,
        actor: entry.actor.username,
        actorName: `${entry.actor.firstName} ${entry.actor.lastName}`,
        adminId: entry.adminId,
      })),
    });
  } catch (error) {
    console.error("Failed to load Superadmin dashboard", error);
    return NextResponse.json({ error: "Failed to load platform statistics" }, { status: 500 });
  }
}
