import { NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const access = await requireApiAccess(request, "to-companies");
  if (access instanceof NextResponse) return access;
  try {
    const workspace = workspaceWhere(access.user);
    const [totalToCompanies, gstUpdatedCount] = await Promise.all([
      prisma.toCompany.count({ where: workspace }),
      prisma.toCompany.count({ where: { ...workspace, gstNo: { not: "" } } }),
    ]);

    return NextResponse.json({
      totalToCompanies,
      gstUpdatedCount,
      unregisteredCount: totalToCompanies - gstUpdatedCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
