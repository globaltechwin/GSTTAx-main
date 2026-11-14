import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validateInvoiceNumberFormat } from "@/lib/invoice-numbering";

const sections = [
  "general",
  "company",
  "billing",
  "invoice",
  "gst-tax",
  "notifications",
  "printing",
  "users-roles",
  "security",
  "backup-restore",
  "appearance",
  "integrations",
  "system-preferences",
] as const;

const allowedKeysBySection: Record<(typeof sections)[number], readonly string[]> = {
  general: ["companyName", "timezone", "currency", "dateFormat", "numberFormat", "language", "financialYear"],
  company: ["legalName", "gstin", "email", "phone", "address"],
  billing: ["paymentTermsDays", "roundingMode", "defaultNotes"],
  invoice: ["invoicePrefix", "invoiceTerms", "invoiceFooter", "showDueDate", "invoiceNumberEnabled", "invoiceNumberPrefix", "invoiceNumberFormat", "invoiceNumberStart", "invoiceNumberPadding", "invoiceAllowManualOverride", "proformaNumberEnabled", "proformaNumberPrefix", "proformaNumberFormat", "proformaNumberStart", "proformaNumberPadding", "proformaAllowManualOverride", "deliveryChallanNumberEnabled", "deliveryChallanNumberPrefix", "deliveryChallanNumberFormat", "deliveryChallanNumberStart", "deliveryChallanNumberPadding", "deliveryChallanAllowManualOverride", "purchaseOrderNumberEnabled", "purchaseOrderNumberPrefix", "purchaseOrderNumberFormat", "purchaseOrderNumberStart", "purchaseOrderNumberPadding", "purchaseOrderAllowManualOverride"],
  "gst-tax": ["defaultGstRate", "defaultTaxType", "reverseCharge", "defaultHsnSac"],
  notifications: ["inAppNotifications", "emailNotifications"],
  printing: ["paperSize", "orientation", "marginsMm", "showLogo", "printFooter"],
  "users-roles": ["newUserStatus", "defaultUserModuleAccess"],
  security: ["minimumPasswordLength", "sessionTimeoutMinutes", "maxLoginAttempts"],
  "backup-restore": ["retentionDays", "backupFrequency"],
  appearance: ["theme", "compactTables"],
  integrations: ["preferredProvider", "integrationEnabled"],
  "system-preferences": ["defaultPageSize", "confirmDestructiveActions"],
};

const settingInput = z.object({
  section: z.enum(sections),
  values: z.record(z.string().trim().min(1).max(100), z.string().max(5000)).refine(
    (values) => Object.keys(values).length <= 100,
    "A settings section can contain at most 100 entries"
  ),
});

export async function GET(request: NextRequest) {
  const access = await requireApiAccess(request, "settings");
  if (access instanceof NextResponse) return access;
  if (access.user.role === "SUPERADMIN") {
    return NextResponse.json({ error: "Use the platform settings endpoint" }, { status: 403 });
  }

  try {
    const settings = await prisma.workspaceSetting.findMany({
      where: { adminId: access.user.workspaceId! },
    });
    return NextResponse.json(
      Object.fromEntries(settings.map(({ key, value, updatedAt }) => [key, { value, updatedAt }]))
    );
  } catch (error) {
    console.error("Failed to load workspace settings", error);
    return NextResponse.json({ error: "Failed to load workspace settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const access = await requireApiAccess(request, "settings", "update");
  if (access instanceof NextResponse) return access;
  if (access.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  try {
    const parsed = settingInput.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid workspace settings", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { section, values } = parsed.data;
    const allowedKeys = allowedKeysBySection[section];
    if (Object.keys(values).some((key) => !allowedKeys.includes(key))) {
      return NextResponse.json({ error: "One or more settings are not supported in this section" }, { status: 400 });
    }
    if (section === "invoice") {
      const prefix = values.invoiceNumberPrefix ?? "IN";
      const format = values.invoiceNumberFormat ?? "{prefix}-{number}/{FY}";
      const start = Number(values.invoiceNumberStart ?? "1");
      const padding = Number(values.invoiceNumberPadding ?? "2");
      if (!/^[A-Za-z0-9_-]{1,8}$/.test(prefix)) return NextResponse.json({ error: "Invoice prefix must contain 1–8 letters, numbers, hyphens or underscores." }, { status: 400 });
      if (!validateInvoiceNumberFormat(format)) return NextResponse.json({ error: "Invalid invoice number format. Include both {number} and {FY}; supported tokens are {prefix}, {number} and {FY}. The format must fit within 50 characters." }, { status: 400 });
      if (!Number.isSafeInteger(start) || start < 1 || start > 99999999) return NextResponse.json({ error: "Starting number must be between 1 and 99,999,999." }, { status: 400 });
      if (!Number.isInteger(padding) || padding < 1 || padding > 8) return NextResponse.json({ error: "Number padding must be between 1 and 8 digits." }, { status: 400 });
      const groups = [
        ["proforma", "Proforma"],
        ["deliveryChallan", "Delivery Challan"],
        ["purchaseOrder", "Purchase Order"],
      ] as const;
      for (const [key, label] of groups) {
        const groupPrefix = values[`${key}NumberPrefix`] ?? (key === "proforma" ? "PI" : key === "deliveryChallan" ? "DC" : "PO");
        const groupFormat = values[`${key}NumberFormat`] ?? "{prefix}-{number}/{FY}";
        const groupStart = Number(values[`${key}NumberStart`] ?? "1");
        const groupPadding = Number(values[`${key}NumberPadding`] ?? "3");
        if (!/^[A-Za-z0-9_-]{1,8}$/.test(groupPrefix)) return NextResponse.json({ error: `${label} prefix must contain 1–8 letters, numbers, hyphens or underscores.` }, { status: 400 });
        if (!validateInvoiceNumberFormat(groupFormat)) return NextResponse.json({ error: `${label} format must include {number} and {FY}; supported tokens are {prefix}, {number} and {FY}.` }, { status: 400 });
        if (!Number.isSafeInteger(groupStart) || groupStart < 1 || groupStart > 99999999) return NextResponse.json({ error: `${label} starting number must be between 1 and 99,999,999.` }, { status: 400 });
        if (!Number.isInteger(groupPadding) || groupPadding < 1 || groupPadding > 8) return NextResponse.json({ error: `${label} number padding must be between 1 and 8 digits.` }, { status: 400 });
      }
    }
    const saved = await prisma.workspaceSetting.upsert({
      where: { adminId_key: { adminId: access.user.workspaceId!, key: section } },
      create: { adminId: access.user.workspaceId!, key: section, value: values },
      update: { value: values },
      select: { key: true, value: true, updatedAt: true },
    });
    return NextResponse.json({ key: saved.key, value: saved.value, updatedAt: saved.updatedAt });
  } catch (error) {
    console.error("Failed to save workspace settings", error);
    return NextResponse.json({ error: "Failed to save workspace settings" }, { status: 500 });
  }
}
