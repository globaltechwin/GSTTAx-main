import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { referralSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "referrals");
  if (access instanceof NextResponse) return access;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "25", 10) || 25)
    );
    const requestedSort = searchParams.get("sortBy") ?? "date";
    const sortBy = ["name", "email", "mobile", "date"].includes(requestedSort)
      ? requestedSort
      : "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const where = {
      ...workspaceWhere(access.user),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { mobile: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          workspace: {
            select: { id: true, username: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.referral.count({ where }),
    ]);
    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error("Failed to fetch referrals", error);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "referrals", "create");
  if (access instanceof NextResponse) return access;

  try {
    const parsed = referralSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid referral data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, mobile, date } = parsed.data;
    const referralDate = new Date(date);
    if (Number.isNaN(referralDate.getTime())) {
      return NextResponse.json({ error: "Invalid referral date" }, { status: 400 });
    }

    const referral = await prisma.referral.create({
      data: {
        adminId: access.user.workspaceId!,
        name: name.trim(),
        email: email?.trim() || null,
        mobile: mobile?.trim() || null,
        date: referralDate,
      },
    });
    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error("Failed to create referral", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
