import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
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
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: parseInt(id) },
    });

    const invoice = await prisma.invoice.update({
      where: { id: parseInt(id) },
      data: {
        orderId,
        ...(companyId ? { company: { connect: { id: companyId } } } : { company: { disconnect: true } }),
        ...(toCompanyId
          ? { toCompany: { connect: { id: toCompanyId } } }
          : { toCompany: { disconnect: true } }),
        ...(billToCompanyId || toCompanyId
          ? { billToCompany: { connect: { id: billToCompanyId || toCompanyId } } }
          : { billToCompany: { disconnect: true } }),
        ...(shipToCompanyId || toCompanyId
          ? { shipToCompany: { connect: { id: shipToCompanyId || toCompanyId } } }
          : { shipToCompany: { disconnect: true } }),
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

    return NextResponse.json(invoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
