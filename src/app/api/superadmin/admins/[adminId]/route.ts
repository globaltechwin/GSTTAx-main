import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadminApi } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { MODULE_KEYS } from "@/lib/permissions";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ adminId: string }> };

const adminUpdate = z
  .object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    email: z.string().email().max(100).optional().or(z.literal("")),
    phone: z.string().max(20).optional(),
    password: z.string().min(4, "Password must be at least 4 characters").max(128).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    modules: z.array(z.enum(MODULE_KEYS)).max(MODULE_KEYS.length).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one value must be provided");

function readAdminId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;
  const id = readAdminId((await params).adminId);
  if (!id) return NextResponse.json({ error: "Invalid Admin ID" }, { status: 400 });

  try {
    const admin = await prisma.user.findFirst({
      where: { id, role: { in: ["admin", "ADMIN"] } },
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
    });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    let modules: string[] = [];
    try {
      const raw: unknown = JSON.parse(admin.sidebarAccess || "[]");
      if (Array.isArray(raw)) {
        modules = raw.filter(
          (module): module is string =>
            typeof module === "string" && (MODULE_KEYS as readonly string[]).includes(module)
        );
      }
    } catch {
      modules = [];
    }
    return NextResponse.json({
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      username: admin.username,
      email: admin.email,
      phone: admin.phone,
      status: admin.status,
      createdAt: admin.createdAt,
      modules,
      userCount: admin._count.users,
      companyCount: admin._count.companies,
      invoiceCount: admin._count.invoices,
      purchaseCount: admin._count.purchases,
    });
  } catch (error) {
    console.error("Failed to fetch Admin", error);
    return NextResponse.json({ error: "Failed to fetch Admin" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;
  const id = readAdminId((await params).adminId);
  if (!id) return NextResponse.json({ error: "Invalid Admin ID" }, { status: 400 });

  try {
    const parsed = adminUpdate.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Admin update", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const target = await prisma.user.findFirst({
      where: { id, role: { in: ["admin", "ADMIN"] } },
      select: { id: true, status: true },
    });
    if (!target) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const values = parsed.data;
    const data = {
      ...(values.firstName !== undefined ? { firstName: values.firstName } : {}),
      ...(values.lastName !== undefined ? { lastName: values.lastName } : {}),
      ...(values.email !== undefined ? { email: values.email || null } : {}),
      ...(values.phone !== undefined ? { phone: values.phone || null } : {}),
      ...(values.password ? { password: await hashPassword(values.password) } : {}),
      ...(values.status ? { status: values.status } : {}),
      ...(values.modules ? { sidebarAccess: JSON.stringify(values.modules) } : {}),
    };

    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id }, data });
      if (values.status === "inactive" || values.password) {
        await transaction.session.deleteMany({
          where: {
            user: values.status === "inactive" ? { adminId: id } : { id },
          },
        });
      }
      if (values.status === "inactive") {
        await transaction.session.deleteMany({ where: { userId: id } });
      }
      await transaction.auditLog.create({
        data: {
          actorId: access.user.id,
          adminId: id,
          action: values.status ? `admin.${values.status}` : "admin.updated",
          targetId: id,
          details: JSON.stringify({
            changedFields: Object.keys(values).filter((key) => key !== "password"),
            passwordReset: Boolean(values.password),
          }),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update Admin", error);
    return NextResponse.json({ error: "Failed to update Admin" }, { status: 500 });
  }
}
