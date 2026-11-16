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
          items: true,
          company: { select: { id: true, name: true, gstNo: true, panNo: true, phone: true, email: true, address: true, state: true, logoUrl: true, signatureUrl: true, signatureWidth: true, signatureHeight: true } },
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
    const { companyId, gstNo, partyName, invoiceNo, invoiceDate, state, rate, taxableValue, igst, cgst, sgst, items } =
      parsed.data;
    if (companyId) {
      const company = await prisma.company.findFirst({ where: { id: companyId, adminId: access.user.workspaceId, status: "active" }, select: { id: true } });
      if (!company) return NextResponse.json({ error: "Selected company is invalid for this workspace" }, { status: 400 });
    }
    if (Number.isNaN(new Date(invoiceDate).getTime())) {
      return NextResponse.json({ error: "Invalid purchase date" }, { status: 400 });
    }
    const taxableCents = decimalAmount(taxableValue);
    const taxCents = decimalAmount(igst ?? 0) + decimalAmount(cgst ?? 0) + decimalAmount(sgst ?? 0);
    if (!Number.isSafeInteger(taxableCents + taxCents)) {
      return NextResponse.json({ error: "Purchase total is out of range" }, { status: 400 });
    }

    if (items.length) {
      const productIds = [...new Set(items.map(item => item.productId).filter((id): id is number => Boolean(id)))];
      if (productIds.length) {
        const validProducts = await prisma.product.count({ where: { id: { in: productIds }, adminId: access.user.workspaceId } });
        if (validProducts !== productIds.length) return NextResponse.json({ error: "One or more selected products are invalid for this workspace" }, { status: 400 });
      }
    }
    const purchase = await prisma.purchase.create({
      data: {
        adminId: access.user.workspaceId!,
        companyId: companyId || null,
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
        items: items.length ? { create: items.map(item => ({ productId: item.productId || null, description: item.description, hsn: item.hsn || null, quantity: item.quantity, unit: item.unit || "Nos", unitPrice: item.unitPrice, gstRate: item.gstRate, taxableValue: item.taxableValue, igst: item.igst ?? 0, cgst: item.cgst ?? 0, sgst: item.sgst ?? 0, totalAmount: item.totalAmount })) } : undefined,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
