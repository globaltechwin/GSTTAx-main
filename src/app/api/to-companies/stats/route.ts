import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [totalToCompanies, gstUpdatedCount] = await Promise.all([
      prisma.toCompany.count(),
      prisma.toCompany.count({ where: { gstNo: { not: "" } } }),
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
