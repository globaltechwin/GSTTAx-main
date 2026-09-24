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
        { orderId: { contains: search } },
        { email: { contains: search } },
        { gst: { contains: search } },
        { company: { name: { contains: search } } },
        { toCompany: { name: { contains: search } } },
      ];
    }

    const allowedSortFields = ["orderId", "date", "amount", "total", "createdAt"];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [actualSortBy]: sortOrder === "asc" ? ("asc" as const) : ("desc" as const) };

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              gstNo: true,
              panNo: true,
              address: true,
              state: true,
              stateCode: true,
              phone: true,
              email: true,
              bankHolderName: true,
              bankAccountNumber: true,
              bankIfscCode: true,
              bankName: true,
              bankBranchName: true,
              website: true,
            },
          },
          toCompany: {
            select: {
              id: true,
              name: true,
              gstNo: true,
              email: true,
              address: true,
              state: true,
              stateCode: true,
            },
          },
          billToCompany: {
            select: {
              id: true,
              name: true,
              gstNo: true,
              email: true,
              address: true,
              state: true,
              stateCode: true,
            },
          },
          shipToCompany: {
            select: {
              id: true,
              name: true,
              gstNo: true,
              email: true,
              address: true,
              state: true,
              stateCode: true,
            },
          },
          items: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, pageSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      companyId,
      toCompanyId,
      billToCompanyId,
      shipToCompanyId,
      email,
      gst,
      amount,
      total,
      date,
      taxType,
      cgstRate,
      sgstRate,
      igstRate,
      reverseCharge,
      invoiceNo,
      challanNo,
      transportMode,
      vehicleNo,
      dateOfSupply,
      placeOfSupply,
      stateCode,
      bankHolderName,
      bankAccountNumber,
      bankIfscCode,
      bankName,
      bankBranchName,
      billToName,
      billToAddress,
      billToGstin,
      billToEmail,
      billToState,
      billToStateCode,
      shipToName,
      shipToAddress,
      shipToGstin,
      shipToEmail,
      shipToState,
      shipToStateCode,
      termsAndConditions,
      logoUrl,
      phone,
      items,
    } = body;

    if (!orderId || !date) {
      return NextResponse.json({ error: "Order ID and date are required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        ...(companyId ? { company: { connect: { id: companyId } } } : {}),
        ...(toCompanyId ? { toCompany: { connect: { id: toCompanyId } } } : {}),
        ...(billToCompanyId || toCompanyId
          ? { billToCompany: { connect: { id: billToCompanyId || toCompanyId } } }
          : {}),
        ...(shipToCompanyId || toCompanyId
          ? { shipToCompany: { connect: { id: shipToCompanyId || toCompanyId } } }
          : {}),
        email: email || null,
        gst: gst || null,
        amount: amount || null,
        total: total || null,
        date: new Date(date),
        taxType: taxType || "CGST_SGST",
        cgstRate: cgstRate || 0,
        sgstRate: sgstRate || 0,
        igstRate: igstRate || 0,
        reverseCharge: reverseCharge || false,
        invoiceNo: invoiceNo || null,
        challanNo: challanNo || null,
        transportMode: transportMode || null,
        vehicleNo: vehicleNo || null,
        dateOfSupply: dateOfSupply ? new Date(dateOfSupply) : null,
        placeOfSupply: placeOfSupply || null,
        stateCode: stateCode || null,
        bankHolderName: bankHolderName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankIfscCode: bankIfscCode || null,
        bankName: bankName || null,
        bankBranchName: bankBranchName || null,
        billToName: billToName || null,
        billToAddress: billToAddress || null,
        billToGstin: billToGstin || null,
        billToEmail: billToEmail || null,
        billToState: billToState || null,
        billToStateCode: billToStateCode || null,
        shipToName: shipToName || null,
        shipToAddress: shipToAddress || null,
        shipToGstin: shipToGstin || null,
        shipToEmail: shipToEmail || null,
        shipToState: shipToState || null,
        shipToStateCode: shipToStateCode || null,
        termsAndConditions: termsAndConditions || null,
        logoUrl: logoUrl || null,
        phone: phone || null,
        items: {
          create:
            items?.map((item: Record<string, unknown>) => ({
              description: (item.description as string) || null,
              hsn: (item.hsn as string) || null,
              sac: (item.sac as string) || null,
              quantity: (item.quantity as number) || 0,
              unit: (item.unit as string) || (item.per as string) || "Pcs",
              price: (item.price as number) || 0,
              per: (item.per as string) || "Pcs",
              amount: (item.amount as number) || 0,
              gstType: (item.gstType as string) || null,
              igstRate: item.igstRate != null ? (item.igstRate as number) : null,
              cgstRate: item.cgstRate != null ? (item.cgstRate as number) : null,
              sgstRate: item.sgstRate != null ? (item.sgstRate as number) : null,
            })) || [],
        },
      },
      include: {
        company: true,
        toCompany: true,
        billToCompany: true,
        shipToCompany: true,
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
