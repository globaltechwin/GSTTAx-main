import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { calculateInvoiceAmounts } from "@/lib/invoice-math";
import { prisma } from "@/lib/db";
import { invoiceSchema } from "@/lib/validations";

function optionalId(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  const id = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(request, "invoices");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id: parseInt(id), ...workspaceWhere(access.user) },
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
        workspace: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
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
  const access = await requireApiAccess(request, "invoices", "update");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isSafeInteger(invoiceId) || invoiceId < 1) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    const parsed = invoiceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid invoice data", details: parsed.error.flatten() }, { status: 400 });
    }
    const {
      orderId,
      companyId,
      toCompanyId,
      billToCompanyId,
      shipToCompanyId,
      email,
      gst,
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
    } = parsed.data;

    const workspaceId = access.user.workspaceId!;
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, adminId: workspaceId },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const companyRef = optionalId(companyId);
    const toCompanyRef = optionalId(toCompanyId);
    const rawBillToRef = optionalId(billToCompanyId);
    const rawShipToRef = optionalId(shipToCompanyId);
    const billToRef = rawBillToRef ?? toCompanyRef;
    const shipToRef = rawShipToRef ?? toCompanyRef;
    if (
      companyRef === undefined ||
      toCompanyRef === undefined ||
      rawBillToRef === undefined ||
      rawShipToRef === undefined
    ) {
      return NextResponse.json({ error: "Invalid company selection" }, { status: 400 });
    }
    const refsAreOwned = await Promise.all([
      companyRef
        ? prisma.company.count({ where: { id: companyRef, adminId: workspaceId } })
        : Promise.resolve(1),
      ...[toCompanyRef, billToRef, shipToRef].map((refId) =>
        refId
          ? prisma.toCompany.count({ where: { id: refId, adminId: workspaceId } })
          : Promise.resolve(1)
      ),
    ]);
    if (refsAreOwned.some((count) => count !== 1)) {
      return NextResponse.json({ error: "Selected company is unavailable" }, { status: 400 });
    }

    const rate = (value: unknown, key: string) => {
      const parsed = Number(value ?? 0);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        throw new Error(`${key} must be between 0 and 100`);
      }
      return parsed;
    };
    let financials;
    try {
      financials = calculateInvoiceAmounts(items, {
        taxType: typeof taxType === "string" ? taxType : "CGST_SGST",
        cgstRate: rate(cgstRate, "CGST rate"),
        sgstRate: rate(sgstRate, "SGST rate"),
        igstRate: rate(igstRate, "IGST rate"),
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid invoice items" },
        { status: 400 }
      );
    }

    const invoice = await prisma.$transaction(async (transaction) => {
      await transaction.invoiceItem.deleteMany({ where: { invoiceId } });
      return transaction.invoice.update({
      where: { id: invoiceId, adminId: workspaceId },
      data: {
        orderId: orderId.trim(),
        ...(companyRef ? { company: { connect: { id: companyRef } } } : { company: { disconnect: true } }),
        ...(toCompanyRef
          ? { toCompany: { connect: { id: toCompanyRef } } }
          : { toCompany: { disconnect: true } }),
        ...(billToRef
          ? { billToCompany: { connect: { id: billToRef } } }
          : { billToCompany: { disconnect: true } }),
        ...(shipToRef
          ? { shipToCompany: { connect: { id: shipToRef } } }
          : { shipToCompany: { disconnect: true } }),
        email: email || null,
        gst: gst || null,
        amount: financials.amount,
        total: financials.total,
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
        items: { create: financials.items },
      },
      include: {
        company: true,
        toCompany: true,
        billToCompany: true,
        shipToCompany: true,
        items: true,
      },
      });
    });

    return NextResponse.json(invoice);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireApiAccess(request, "invoices", "delete");
  if (access instanceof NextResponse) return access;
  try {
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isSafeInteger(invoiceId) || invoiceId < 1) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }
    const result = await prisma.invoice.deleteMany({
      where: { id: invoiceId, adminId: access.user.workspaceId },
    });
    if (!result.count) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
