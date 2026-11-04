import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function matchesSecret(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const bootstrapToken = process.env.BOOTSTRAP_TOKEN;
  const providedToken = request.headers.get("x-bootstrap-token") ?? "";
  if (
    !bootstrapToken ||
    bootstrapToken.length < 32 ||
    !matchesSecret(providedToken, bootstrapToken)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const { firstName, lastName, username, password } = values;
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
        { error: "Provide names, a valid username, and a password of at least 4 characters" },
        { status: 400 }
      );
    }

    const existingSuperadmin = await prisma.user.findFirst({
      where: { role: { in: ["superadmin", "SUPERADMIN"] } },
      select: { id: true },
    });
    if (existingSuperadmin) {
      return NextResponse.json(
        { error: "Superadmin bootstrap has already been completed" },
        { status: 409 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "Username is already in use" }, { status: 409 });
    }

    const user = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username,
          password: await hashPassword(password),
          role: "superadmin",
          status: "active",
          sidebarAccess: JSON.stringify(["dashboard", "users", "settings"]),
          superadminKey: "global",
        },
        select: { id: true, username: true, role: true },
      });

      const activeAdmins = await transaction.user.findMany({
        where: { role: { in: ["admin", "ADMIN"] }, status: "active" },
        select: { id: true },
      });

      if (activeAdmins.length === 1) {
        const adminId = activeAdmins[0].id;
        await Promise.all([
          transaction.user.updateMany({
            where: { adminId: null, role: { in: ["user", "USER"] } },
            data: { adminId },
          }),
          transaction.company.updateMany({ where: { adminId: null }, data: { adminId } }),
          transaction.toCompany.updateMany({ where: { adminId: null }, data: { adminId } }),
          transaction.referral.updateMany({ where: { adminId: null }, data: { adminId } }),
          transaction.invoice.updateMany({ where: { adminId: null }, data: { adminId } }),
          transaction.purchase.updateMany({ where: { adminId: null }, data: { adminId } }),
          transaction.importHistory.updateMany({ where: { adminId: null }, data: { adminId } }),
          transaction.exportHistory.updateMany({ where: { adminId: null }, data: { adminId } }),
          transaction.backupHistory.updateMany({ where: { adminId: null }, data: { adminId } }),
        ]);
        const existingInvoiceNumbers = await transaction.invoice.findMany({
          where: { adminId },
          select: { invoiceNo: true },
        });
        const currentValue = existingInvoiceNumbers.reduce((maximum, invoice) => {
          const parsed = Number.parseInt(invoice.invoiceNo ?? "", 10);
          return Number.isSafeInteger(parsed) ? Math.max(maximum, parsed) : maximum;
        }, 0);
        const currentSequence = await transaction.invoiceSequence.findUnique({
          where: { adminId },
          select: { currentValue: true },
        });
        if (!currentSequence) {
          await transaction.invoiceSequence.create({ data: { adminId, currentValue } });
        } else if (currentSequence.currentValue < currentValue) {
          await transaction.invoiceSequence.update({
            where: { adminId },
            data: { currentValue },
          });
        }
        await transaction.auditLog.create({
          data: {
            actorId: created.id,
            adminId,
            action: "workspace.legacy_data_adopted",
            targetId: adminId,
            details: JSON.stringify({ adminId }),
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          actorId: created.id,
          action: "superadmin.bootstrapped",
          targetId: created.id,
        },
      });
      return created;
    });

    return NextResponse.json(
      { success: true, user, message: "Remove BOOTSTRAP_TOKEN from the server environment now." },
      { status: 201 }
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Superadmin bootstrap has already been completed" },
        { status: 409 }
      );
    }
    console.error("Superadmin bootstrap failed", error);
    return NextResponse.json({ error: "Unable to complete Superadmin bootstrap" }, { status: 500 });
  }
}
