import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const allowedSortFields = ["firstName", "lastName", "username", "role", "status", "createdAt"];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [actualSortBy]: sortOrder === "asc" ? ("asc" as const) : ("desc" as const) };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
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
        },
      }),
      prisma.user.count({ where }),
    ]);

    const safeData = data.map((u) => ({
      ...u,
      sidebarAccess: u.sidebarAccess ? JSON.parse(u.sidebarAccess) : [],
    }));

    return NextResponse.json({ data: safeData, total, page, pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, username, password, email, phone, role, status, sidebarAccess } = body;

    if (!firstName || !lastName || !username || !password) {
      return NextResponse.json({ error: "First name, last name, username, and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        password,
        email: email || null,
        phone: phone || null,
        role: role || "user",
        status: status || "active",
        sidebarAccess: JSON.stringify(sidebarAccess || []),
      },
    });

    return NextResponse.json({
      ...user,
      sidebarAccess: user.sidebarAccess ? JSON.parse(user.sidebarAccess) : [],
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
