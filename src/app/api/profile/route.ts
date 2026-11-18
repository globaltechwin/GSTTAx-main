import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

function normalizeOptional(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        status: true,
        sidebarAccess: true,
        createdAt: true,
        admin: { select: { id: true, firstName: true, lastName: true, username: true } },
      },
    });
    if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    let ownModules: string[] = [];
    try {
      const parsed: unknown = JSON.parse(user.sidebarAccess || "[]");
      if (Array.isArray(parsed)) ownModules = parsed.filter((item): item is string => typeof item === "string");
    } catch {
      ownModules = [];
    }

    const effectiveModules =
      sessionUser.role === "SUPERADMIN"
        ? ["dashboard", "superadmin-admins", "companies", "products", "to-companies", "invoices", "proforma-invoices", "delivery-challans", "vendors", "purchase-orders", "purchases", "turnover-report", "referrals", "import-export", "users", "settings"]
        : sessionUser.role === "ADMIN"
          ? ownModules
          : sessionUser.sidebarAccess;

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role.toUpperCase(),
      status: user.status,
      createdAt: user.createdAt,
      workspace: user.role.toLowerCase() === "user" && user.admin
        ? `${user.admin.firstName} ${user.admin.lastName}`.trim() || user.admin.username
        : user.role.toLowerCase() === "admin"
          ? `${user.firstName} ${user.lastName}`.trim() || user.username
          : "GSTTax Platform",
      modules: effectiveModules,
    });
  } catch (error) {
    console.error("Failed to load profile", error);
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const values = body as Record<string, unknown>;
    const firstName = values.firstName;
    const lastName = values.lastName;
    const email = normalizeOptional(values.email, 100);
    const phone = normalizeOptional(values.phone, 20);

    if (typeof firstName !== "string" || !firstName.trim() || firstName.trim().length > 50) {
      return NextResponse.json({ error: "First name is required (maximum 50 characters)" }, { status: 400 });
    }
    if (typeof lastName !== "string" || !lastName.trim() || lastName.trim().length > 50) {
      return NextResponse.json({ error: "Last name is required (maximum 50 characters)" }, { status: 400 });
    }
    if (values.email !== undefined && email === undefined) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (values.phone !== undefined && phone === undefined) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(values.email !== undefined ? { email } : {}),
        ...(values.phone !== undefined ? { phone } : {}),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Failed to update profile", error);
    return NextResponse.json({ error: "Unable to save profile changes" }, { status: 500 });
  }
}
