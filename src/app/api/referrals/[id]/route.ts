import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { referralSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const access = await requireApiAccess(request, "referrals");
  if (access instanceof NextResponse) return access;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid referral ID" }, { status: 400 });

  try {
    const referral = await prisma.referral.findFirst({
      where: { id, ...workspaceWhere(access.user) },
      include: {
        workspace: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });
    if (!referral) return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    return NextResponse.json(referral);
  } catch (error) {
    console.error("Failed to fetch referral", error);
    return NextResponse.json({ error: "Failed to fetch referral" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await requireApiAccess(request, "referrals", "update");
  if (access instanceof NextResponse) return access;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid referral ID" }, { status: 400 });

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

    const result = await prisma.referral.updateMany({
      where: { id, adminId: access.user.workspaceId },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        mobile: mobile?.trim() || null,
        date: referralDate,
      },
    });
    if (!result.count) return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    const referral = await prisma.referral.findFirst({
      where: { id, adminId: access.user.workspaceId },
    });
    return NextResponse.json(referral);
  } catch (error) {
    console.error("Failed to update referral", error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await requireApiAccess(request, "referrals", "delete");
  if (access instanceof NextResponse) return access;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid referral ID" }, { status: 400 });

  try {
    const result = await prisma.referral.deleteMany({
      where: { id, adminId: access.user.workspaceId },
    });
    if (!result.count) return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete referral", error);
    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}
