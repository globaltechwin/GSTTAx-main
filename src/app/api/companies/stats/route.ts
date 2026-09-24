import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalCompanies,
      activeCount,
      inactiveCount,
      gstUpdatedCount,
      pendingCount,
      suspendedCount,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "active" } }),
      prisma.company.count({ where: { status: "inactive" } }),
      prisma.company.count({ where: { gstNo: { not: "" } } }),
      prisma.company.count({ where: { status: "pending" } }),
      prisma.company.count({ where: { status: "suspended" } }),
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
