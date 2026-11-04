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

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "invoices");
  if (access instanceof NextResponse) return access;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const documentType = searchParams.get("documentType") === "PROFORMA" ? "PROFORMA" : "TAX_INVOICE";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { ...workspaceWhere(access.user), documentType };

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
              logoUrl: true,
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
  const access = await requireApiAccess(request, "invoices", "create");
  if (access instanceof NextResponse) return access;
  try {
    const parsed = invoiceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const {
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
      documentType,
      discountAmount,
      kindAttn,
      mobileNo,
      poNumber,
      poDate,
      items,
    } = parsed.data;

    const workspaceId = access.user.workspaceId!;
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
      ...[toCompanyRef, billToRef, shipToRef].map((id) =>
        id ? prisma.toCompany.count({ where: { id, adminId: workspaceId } }) : Promise.resolve(1)
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
        discountAmount: Number(discountAmount || 0),
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid invoice items" },
        { status: 400 }
      );
    }

    const createInvoice = () =>
      prisma.$transaction(async (transaction) => {
        let allocatedNumber: string;
        if (documentType === "PROFORMA") {
          const sequence = await transaction.proformaSequence.findUnique({ where: { adminId: workspaceId }, select: { currentValue: true } });
          if (!sequence) await transaction.proformaSequence.create({ data: { adminId: workspaceId, currentValue: 0 } });
          const allocated = await transaction.proformaSequence.update({ where: { adminId: workspaceId }, data: { currentValue: { increment: 1 } }, select: { currentValue: true } });
          allocatedNumber = `PI-${allocated.currentValue}`;
        } else {
          const sequence = await transaction.invoiceSequence.findUnique({ where: { adminId: workspaceId }, select: { currentValue: true } });
          if (!sequence) {
            const existingNumbers = await transaction.invoice.findMany({ where: { adminId: workspaceId, documentType: "TAX_INVOICE" }, select: { invoiceNo: true } });
            const maximum = existingNumbers.reduce((value, record) => { const parsed = Number.parseInt(record.invoiceNo ?? "", 10); return Number.isSafeInteger(parsed) ? Math.max(value, parsed) : value; }, 0);
            await transaction.invoiceSequence.create({ data: { adminId: workspaceId, currentValue: maximum } });
          }
          const allocated = await transaction.invoiceSequence.update({ where: { adminId: workspaceId }, data: { currentValue: { increment: 1 } }, select: { currentValue: true } });
          allocatedNumber = String(allocated.currentValue);
        }

        return transaction.invoice.create({
          data: {
            workspace: { connect: { id: workspaceId } },
            orderId: allocatedNumber,
            ...(companyRef ? { company: { connect: { id: companyRef } } } : {}),
            ...(toCompanyRef ? { toCompany: { connect: { id: toCompanyRef } } } : {}),
            ...(billToRef ? { billToCompany: { connect: { id: billToRef } } } : {}),
            ...(shipToRef ? { shipToCompany: { connect: { id: shipToRef } } } : {}),
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
            invoiceNo: allocatedNumber,
            documentType: documentType || "TAX_INVOICE",
            discountAmount: financials.discountAmount,
            kindAttn: kindAttn || null,
            mobileNo: mobileNo || null,
            poNumber: poNumber || null,
            poDate: poDate ? new Date(poDate) : null,
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
    const invoice = await createInvoice().catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return createInvoice();
      }
      throw error;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
