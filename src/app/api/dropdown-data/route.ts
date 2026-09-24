import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [companies, toCompanies, referrals] = await Promise.all([
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          gstNo: true,
          panNo: true,
          email: true,
          phone: true,
          address: true,
          state: true,
          stateCode: true,
          bankHolderName: true,
          bankAccountNumber: true,
          bankIfscCode: true,
          bankName: true,
          bankBranchName: true,
          website: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.toCompany.findMany({
        select: {
          id: true,
          name: true,
          gstNo: true,
          email: true,
          address: true,
          state: true,
          stateCode: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.referral.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ companies, toCompanies, referrals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch dropdown data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
