import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess, workspaceWhere } from "@/lib/auth";
import { canPerform } from "@/lib/permissions";
import { calculateInvoiceAmounts } from "@/lib/invoice-math";
import { prisma } from "@/lib/db";
import { invoiceSchema, normalizeInvoicePayload } from "@/lib/validations";
import { allocateDocumentNumber, getDocumentNumberingConfig } from "@/lib/document-numbering";

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
    if (access.user.role === "USER" && !canPerform(access.user.actionPermissions, documentType === "PROFORMA" ? "proforma-invoices" : "invoices", "view")) return NextResponse.json({ error: "View permission is not granted for this document type" }, { status: 403 });
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
    const parsed = invoiceSchema.safeParse(normalizeInvoicePayload(await request.json()));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    if (access.user.role === "USER" && !canPerform(access.user.actionPermissions, parsed.data.documentType === "PROFORMA" ? "proforma-invoices" : "invoices", "create")) return NextResponse.json({ error: "Create permission is not granted for this document type" }, { status: 403 });
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
      invoiceNo,
      discountAmount,
      roundOff,
      kindAttn,
      mobileNo,
      poNumber,
      poDate,
      items,
    } = parsed.data;

    const workspaceId = access.user.workspaceId!;
    const invoiceSetting = await prisma.workspaceSetting.findUnique({ where: { adminId_key: { adminId: workspaceId, key: "invoice" } }, select: { value: true } });
    const documentNumbering = getDocumentNumberingConfig(invoiceSetting?.value, documentType === "PROFORMA" ? "PROFORMA" : "TAX_INVOICE");
    const requestedInvoiceNo = typeof invoiceNo === "string" ? invoiceNo.trim() : "";
    const manualNumberOverride = parsed.data.manualNumberOverride === true;
    if (!documentNumbering.enabled && !requestedInvoiceNo) {
      return NextResponse.json({ error: `Enter a ${documentType === "PROFORMA" ? "Proforma" : "invoice"} number because automatic numbering is disabled by your Admin.` }, { status: 400 });
    }
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
    const companySignature = companyRef
      ? await prisma.company.findFirst({
          where: { id: companyRef, adminId: workspaceId },
          select: { signatureUrl: true, signatureWidth: true, signatureHeight: true },
        })
      : null;

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
        if (!documentNumbering.enabled || (documentNumbering.allowManualOverride && manualNumberOverride && requestedInvoiceNo)) {
          // Manual numbers never consume the automatic sequence.
          allocatedNumber = requestedInvoiceNo;
        } else {
          allocatedNumber = await allocateDocumentNumber(transaction, workspaceId, documentType === "PROFORMA" ? "PROFORMA" : "TAX_INVOICE", new Date(date), invoiceSetting?.value);
        }

        const duplicate = await transaction.invoice.findFirst({
          where: { adminId: workspaceId, documentType, invoiceNo: allocatedNumber },
          select: { id: true },
        });
        if (duplicate) throw new Error("DOCUMENT_NUMBER_ALREADY_EXISTS");

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
            total: Number((financials.total + Number(roundOff || 0)).toFixed(2)),
            date: new Date(date),
            taxType: taxType || "CGST_SGST",
            cgstRate: cgstRate || 0,
            sgstRate: sgstRate || 0,
            igstRate: igstRate || 0,
            reverseCharge: reverseCharge || false,
            invoiceNo: allocatedNumber,
            documentType: documentType || "TAX_INVOICE",
            discountAmount: financials.discountAmount,
            roundOff: Number(roundOff || 0),
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
            signatureUrl: companySignature?.signatureUrl ?? null,
            signatureWidth: companySignature?.signatureWidth ?? null,
            signatureHeight: companySignature?.signatureHeight ?? null,
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
      }, { isolationLevel: "Serializable" });
    const invoice = await createInvoice().catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && (error.code === "P2002" || error.code === "P2034")) {
        return createInvoice();
      }
      throw error;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "DOCUMENT_NUMBER_ALREADY_EXISTS") {
      return NextResponse.json({ error: "This document number already exists in your workspace. Enter a different number or use the next generated number." }, { status: 409 });
    }
    if (err instanceof Error && err.message === "DOCUMENT_NUMBER_MANUAL_REQUIRED") {
      return NextResponse.json({ error: "Enter a document number because automatic numbering is disabled by your Admin." }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
