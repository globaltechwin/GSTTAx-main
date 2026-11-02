import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadminApi } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { MODULE_KEYS } from "@/lib/permissions";
import { prisma } from "@/lib/db";

const adminInput = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  username: z.string().regex(/^[A-Za-z0-9._-]{3,50}$/),
  password: z.string().min(12).max(128),
  email: z.string().email().max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  modules: z.array(z.enum(MODULE_KEYS)).max(MODULE_KEYS.length),
});

function readModules(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return Array.isArray(value)
      ? value.filter(
          (item): item is string =>
            typeof item === "string" && (MODULE_KEYS as readonly string[]).includes(item)
        )
      : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status");
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "25", 10) || 25)
    );
    const where = {
      role: { in: ["admin", "ADMIN"] },
      ...(status === "active" || status === "inactive" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { username: { contains: search } },
            ],
          }
        : {}),
    };

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          phone: true,
          status: true,
          sidebarAccess: true,
          createdAt: true,
          _count: { select: { users: true, companies: true, invoices: true, purchases: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: admins.map(({ sidebarAccess, _count, ...admin }) => ({
        ...admin,
        modules: readModules(sidebarAccess),
        userCount: _count.users,
        companyCount: _count.companies,
        invoiceCount: _count.invoices,
        purchaseCount: _count.purchases,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Failed to list Admin workspaces", error);
    return NextResponse.json({ error: "Failed to list Admin workspaces" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;

  try {
    const parsed = adminInput.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Admin details", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const values = parsed.data;
    const existing = await prisma.user.findUnique({
      where: { username: values.username },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "Username already exists" }, { status: 409 });

    const admin = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          password: await hashPassword(values.password),
          email: values.email || null,
          phone: values.phone || null,
          role: "admin",
          status: "active",
          sidebarAccess: JSON.stringify(values.modules),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          status: true,
        },
      });

      await transaction.invoiceSequence.create({
        data: { adminId: created.id, currentValue: 0 },
      });
      await transaction.auditLog.create({
        data: {
          actorId: access.user.id,
          adminId: created.id,
          action: "admin.created",
          targetId: created.id,
          details: JSON.stringify({ modules: values.modules }),
        },
      });
      return created;
    });

    return NextResponse.json({ ...admin, modules: values.modules }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Admin username already exists" }, { status: 409 });
    }
    console.error("Failed to create Admin workspace", error);
    return NextResponse.json({ error: "Failed to create Admin workspace" }, { status: 500 });
  }
}
