import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const gstFilter = searchParams.get("gst") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { gstNo: { contains: search } },
        { vendorCode: { contains: search } },
      ];
    }

    if (gstFilter === "registered") {
      where.gstNo = { not: "" };
    } else if (gstFilter === "unregistered") {
      where.OR = [{ gstNo: null }, { gstNo: "" }];
    }

    const allowedSortFields = ["name", "gstNo", "vendorCode", "date", "createdAt"];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [actualSortBy]: sortOrder === "asc" ? ("asc" as const) : ("desc" as const) };

    const [data, total] = await Promise.all([
      prisma.toCompany.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.toCompany.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch to companies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gstNo, vendorCode, date } = body;

    if (!name || !date) {
      return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
    }

    const existingByName = await prisma.toCompany.findFirst({ where: { name } });
    if (existingByName) {
      return NextResponse.json(
        { error: "A to-company with this name already exists" },
        { status: 409 }
      );
    }

    const toCompany = await prisma.toCompany.create({
      data: {
        name,
        gstNo: gstNo || null,
        vendorCode: vendorCode || null,
        date: new Date(date),
      },
    });

    return NextResponse.json(toCompany, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create to-company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
