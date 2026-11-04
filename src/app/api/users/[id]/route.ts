import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import { MODULE_KEYS } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function safePermissions(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is string =>
        typeof item === "string" && (MODULE_KEYS as readonly string[]).includes(item)
    );
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const access = await requireApiAccess(request, "users", "view", true);
  if (access instanceof NextResponse) return access;
  if (access.user.role !== "ADMIN" && access.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

  try {
    const user = await prisma.user.findFirst({
      where: {
        id,
        ...(access.user.role === "SUPERADMIN" ? {} : workspaceWhere(access.user)),
        role: { notIn: ["superadmin", "SUPERADMIN"] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        sidebarAccess: true,
        createdAt: true,
        admin: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ...user, sidebarAccess: safePermissions(user.sidebarAccess) });
  } catch (error) {
    console.error("Failed to fetch user", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await requireApiAccess(request, "users", "update", true);
  if (access instanceof NextResponse) return access;
  if (access.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const values = body as Record<string, unknown>;
    const existing = await prisma.user.findFirst({
      where: {
        id,
        adminId: access.user.workspaceId,
        role: { notIn: ["superadmin", "SUPERADMIN"] },
      },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { firstName, lastName, username, password, email, phone, status, sidebarAccess } = values;
    const data: {
      firstName?: string;
      lastName?: string;
      username?: string;
      password?: string;
      email?: string | null;
      phone?: string | null;
      status?: string;
      sidebarAccess?: string;
    } = {};

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim()) {
        return NextResponse.json({ error: "First name is required" }, { status: 400 });
      }
      data.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (typeof lastName !== "string" || !lastName.trim()) {
        return NextResponse.json({ error: "Last name is required" }, { status: 400 });
      }
      data.lastName = lastName.trim();
    }
    if (username !== undefined) {
      if (typeof username !== "string" || !/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
        return NextResponse.json({ error: "Invalid username" }, { status: 400 });
      }
      data.username = username;
    }
    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 4 || password.length > 128) {
        return NextResponse.json(
          { error: "Password must be between 4 and 128 characters" },
          { status: 400 }
        );
      }
      data.password = await hashPassword(password);
    }
    if (email !== undefined) {
      if (email !== null && typeof email !== "string") {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
      data.email = typeof email === "string" && email.trim() ? email.trim() : null;
    }
    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
      data.phone = typeof phone === "string" && phone.trim() ? phone.trim() : null;
    }
    if (status !== undefined) {
      if (status !== "active" && status !== "inactive") {
        return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
      }
      data.status = status;
    }
    if (sidebarAccess !== undefined) {
      if (
        !Array.isArray(sidebarAccess) ||
        sidebarAccess.some(
          (module) =>
            typeof module !== "string" ||
            !(MODULE_KEYS as readonly string[]).includes(module)
        )
      ) {
        return NextResponse.json({ error: "Invalid module permissions" }, { status: 400 });
      }
      if (sidebarAccess.some((module) => !access.user.sidebarAccess.includes(module))) {
        return NextResponse.json(
          { error: "Users can only be assigned modules granted to this workspace" },
          { status: 403 }
        );
      }
      data.sidebarAccess = JSON.stringify(sidebarAccess);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        sidebarAccess: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      ...user,
      sidebarAccess: safePermissions(user.sidebarAccess),
    });
  } catch (error) {
    console.error("Failed to update user", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await requireApiAccess(request, "users", "delete", true);
  if (access instanceof NextResponse) return access;
  if (access.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  if (id === access.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  try {
    const target = await prisma.user.findFirst({
      where: {
        id,
        adminId: access.user.workspaceId,
        role: { notIn: ["superadmin", "SUPERADMIN"] },
      },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.update({
      where: { id },
      data: { status: "inactive" },
    });
    await prisma.session.deleteMany({ where: { userId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to deactivate user", error);
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
  }
}
