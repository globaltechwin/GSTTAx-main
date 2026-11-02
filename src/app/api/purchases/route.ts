import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { purchaseSchema } from "@/lib/validations";

function decimalAmount(value: number): number {
  return Math.round(value * 100);
}

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "purchases");
  if (access instanceof NextResponse) return access;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { ...workspaceWhere(access.user) };

    if (search) {
      where.OR = [
        { partyName: { contains: search } },
        { gstNo: { contains: search } },
        { invoiceNo: { contains: search } },
        { state: { contains: search } },
      ];
    }

    const allowedSortFields = ["partyName", "invoiceNo", "invoiceDate", "state", "totalAmount", "createdAt"];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [actualSortBy]: sortOrder === "asc" ? ("asc" as const) : ("desc" as const) };

    const [data, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          workspace: {
            select: { id: true, username: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.purchase.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch purchases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "purchases", "create");
  if (access instanceof NextResponse) return access;
  try {
    const parsed = purchaseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid purchase data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { gstNo, partyName, invoiceNo, invoiceDate, state, rate, taxableValue, igst, cgst, sgst } =
      parsed.data;
    if (Number.isNaN(new Date(invoiceDate).getTime())) {
      return NextResponse.json({ error: "Invalid purchase date" }, { status: 400 });
    }
    const taxableCents = decimalAmount(taxableValue);
    const taxCents = decimalAmount(igst ?? 0) + decimalAmount(cgst ?? 0) + decimalAmount(sgst ?? 0);
    if (!Number.isSafeInteger(taxableCents + taxCents)) {
      return NextResponse.json({ error: "Purchase total is out of range" }, { status: 400 });
    }

    const purchase = await prisma.purchase.create({
      data: {
        adminId: access.user.workspaceId!,
        gstNo: gstNo || null,
        partyName,
        invoiceNo,
        invoiceDate: new Date(invoiceDate),
        state: state || null,
        rate: rate ?? 0,
        taxableValue: taxableValue ?? 0,
        igst: igst ?? 0,
        cgst: cgst ?? 0,
        sgst: sgst ?? 0,
        totalAmount: (taxableCents + taxCents) / 100,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
