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
      prisma.purchase.findMany({ where, orderBy, skip, take: pageSize }),
      prisma.purchase.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch purchases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gstNo, partyName, invoiceNo, invoiceDate, state, rate, taxableValue, igst, cgst, sgst, totalAmount } = body;

    if (!partyName || !invoiceNo || !invoiceDate) {
      return NextResponse.json({ error: "Party name, invoice number, and invoice date are required" }, { status: 400 });
    }

    const purchase = await prisma.purchase.create({
      data: {
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
        totalAmount: totalAmount ?? 0,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
