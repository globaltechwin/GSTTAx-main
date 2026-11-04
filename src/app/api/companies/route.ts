import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "companies");
  if (access instanceof NextResponse) return access;
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

    const where: Record<string, unknown> = { ...workspaceWhere(access.user) };

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
        include: {
          workspace: {
            select: { id: true, username: true, firstName: true, lastName: true },
          },
        },
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
  const access = await requireApiAccess(request, "companies", "create");
  if (access instanceof NextResponse) return access;
  try {
    const body = await request.json();
    const { name, gstNo, email, date, status, ssiNo, panNo, phone, esiNo, address, epfNo, logoUrl } = body;

    if (!name || !date) {
      return NextResponse.json({ error: "Name and date are required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        adminId: access.user.workspaceId!,
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
        logoUrl: typeof logoUrl === "string" ? logoUrl : null,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
