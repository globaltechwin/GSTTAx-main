import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import { MODULE_KEYS } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "users", "view", true);
  if (access instanceof NextResponse) return access;
  if (access.user.role !== "ADMIN" && access.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") || "10", 10) || 10)
    );
    const skip = (page - 1) * pageSize;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const where = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { username: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const allowedSortFields = [
      "firstName",
      "lastName",
      "username",
      "role",
      "status",
      "createdAt",
    ] as const;
    const actualSortBy = allowedSortFields.includes(
      sortBy as (typeof allowedSortFields)[number]
    )
      ? sortBy
      : "createdAt";

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...where,
          ...(access.user.role === "SUPERADMIN" ? {} : workspaceWhere(access.user)),
          role: { notIn: ["superadmin", "SUPERADMIN"] },
        },
        orderBy: { [actualSortBy]: sortOrder },
        skip,
        take: pageSize,
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
      }),
      prisma.user.count({
        where: {
          ...where,
          ...(access.user.role === "SUPERADMIN" ? {} : workspaceWhere(access.user)),
          role: { notIn: ["superadmin", "SUPERADMIN"] },
        },
      }),
    ]);

    const safeData = data.map((user) => {
      let sidebarAccess: string[] = [];
      try {
        const parsed: unknown = JSON.parse(user.sidebarAccess || "[]");
        if (Array.isArray(parsed)) {
          sidebarAccess = parsed.filter(
            (item): item is string =>
              typeof item === "string" && (MODULE_KEYS as readonly string[]).includes(item)
          );
        }
      } catch {
        sidebarAccess = [];
      }
      const effectiveAccess =
        access.user.role === "ADMIN"
          ? sidebarAccess.filter((module) => access.user.sidebarAccess.includes(module))
          : sidebarAccess;
      return { ...user, sidebarAccess: effectiveAccess };
    });

    return NextResponse.json({ data: safeData, total, page, pageSize });
  } catch (error) {
    console.error("Failed to fetch users", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "users", "create", true);
  if (access instanceof NextResponse) return access;
  if (access.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const values = body as Record<string, unknown>;
    const { firstName, lastName, username, password, email, phone, sidebarAccess } = values;

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      !firstName.trim() ||
      !lastName.trim() ||
      !/^[A-Za-z0-9._-]{3,50}$/.test(username) ||
      password.length < 4 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "Names, a valid username, and a password of at least 4 characters are required" },
        { status: 400 }
      );
    }

    if (
      email !== undefined &&
      email !== null &&
      (typeof email !== "string" || email.length > 100)
    ) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== "string" || phone.length > 20)
    ) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    if (
      sidebarAccess !== undefined &&
      (!Array.isArray(sidebarAccess) ||
        sidebarAccess.some(
          (module) =>
            typeof module !== "string" ||
            !(MODULE_KEYS as readonly string[]).includes(module)
        ))
    ) {
      return NextResponse.json({ error: "Invalid module permissions" }, { status: 400 });
    }
    const requestedModules = (sidebarAccess ?? []) as string[];
    if (requestedModules.some((module) => !access.user.sidebarAccess.includes(module))) {
      return NextResponse.json(
        { error: "Users can only be assigned modules granted to this workspace" },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        adminId: access.user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username,
        password: await hashPassword(password),
        email: typeof email === "string" && email.trim() ? email.trim() : null,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        role: "user",
        status: "active",
        sidebarAccess: JSON.stringify(requestedModules),
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
      },
    });

    return NextResponse.json(
      { ...user, sidebarAccess: requestedModules },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create user", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
