import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionUser, hashSessionToken } from "@/lib/session";
import { hashPassword, verifyLegacyPassword, verifyPassword } from "@/lib/password";
import { isSameOriginRequest } from "@/lib/auth-security";

export async function PUT(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const currentPassword = values.currentPassword;
    const newPassword = values.newPassword;
    const confirmPassword = values.confirmPassword;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return NextResponse.json({ error: "Complete all password fields" }, { status: 400 });
    }

    if (currentPassword.length === 0 || newPassword.length < 4 || newPassword.length > 128) {
      return NextResponse.json(
        { error: "New password must be between 4 and 128 characters" },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation do not match" }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Choose a password different from your current password" }, { status: 400 });
    }

    const account = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { password: true },
    });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const isHashed = account.password.startsWith("scrypt$");
    const currentMatches = isHashed
      ? await verifyPassword(currentPassword, account.password)
      : verifyLegacyPassword(currentPassword, account.password);

    if (!currentMatches) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword, true);
    const cookieStore = await cookies();
    const token = cookieStore.get("gsttax_session")?.value;
    const currentTokenHash = token ? hashSessionToken(token) : null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: sessionUser.id },
        data: { password: passwordHash },
      });
      await tx.session.deleteMany({
        where: {
          userId: sessionUser.id,
          ...(currentTokenHash ? { tokenHash: { not: currentTokenHash } } : {}),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Other active sessions have been signed out.",
    });
  } catch (error) {
    console.error("Failed to change password", error);
    return NextResponse.json({ error: "Unable to change password" }, { status: 500 });
  }
}
