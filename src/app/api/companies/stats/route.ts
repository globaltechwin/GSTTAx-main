import { NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const access = await requireApiAccess(request, "companies");
  if (access instanceof NextResponse) return access;
  try {
    const workspace = workspaceWhere(access.user);
    const [
      totalCompanies,
      activeCount,
      inactiveCount,
      gstUpdatedCount,
      pendingCount,
      suspendedCount,
    ] = await Promise.all([
      prisma.company.count({ where: workspace }),
      prisma.company.count({ where: { ...workspace, status: "active" } }),
      prisma.company.count({ where: { ...workspace, status: "inactive" } }),
      prisma.company.count({ where: { ...workspace, gstNo: { not: "" } } }),
      prisma.company.count({ where: { ...workspace, status: "pending" } }),
      prisma.company.count({ where: { ...workspace, status: "suspended" } }),
    ]);

    return NextResponse.json({
      totalCompanies,
      activeCount,
      inactiveCount,
      gstUpdatedCount,
      pendingCount,
      suspendedCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
