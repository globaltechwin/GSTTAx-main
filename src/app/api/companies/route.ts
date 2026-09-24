import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
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
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (gstFilter === "registered") {
      where.gstNo = { not: "" };
    } else if (gstFilter === "unregistered") {
      where.OR = [{ gstNo: null }, { gstNo: "" }];
    }

    const allowedSortFields = ["name", "gstNo", "email", "phone", "date", "status", "createdAt"];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [actualSortBy]: sortOrder === "asc" ? ("asc" as const) : ("desc" as const) };

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch companies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gstNo, email, date, status, ssiNo, panNo, phone, esiNo, address, epfNo } = body;

    if (!name || !date) {
      return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        gstNo: gstNo || null,
        email: email || null,
        date: new Date(date),
        status: status || "active",
        ssiNo: ssiNo || null,
        panNo: panNo || null,
        phone: phone || null,
        esiNo: esiNo || null,
        address: address || null,
        epfNo: epfNo || null,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
