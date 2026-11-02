import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperadminApi } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  invoice: ["invoicePrefix", "invoiceTerms", "invoiceFooter", "showDueDate"],
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
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;

  try {
    const settings = await prisma.platformSetting.findMany();
    return NextResponse.json(
      Object.fromEntries(settings.map(({ key, value, updatedAt }) => [key, { value, updatedAt }]))
    );
  } catch (error) {
    console.error("Failed to load platform settings", error);
    return NextResponse.json({ error: "Failed to load platform settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const access = await requireSuperadminApi(request);
  if (access instanceof NextResponse) return access;

  try {
    const parsed = settingInput.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid platform settings", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { section, values } = parsed.data;
    const allowedKeys = allowedKeysBySection[section];
    if (Object.keys(values).some((key) => !allowedKeys.includes(key))) {
      return NextResponse.json({ error: "One or more settings are not supported in this section" }, { status: 400 });
    }
    const saved = await prisma.platformSetting.upsert({
      where: { key: section },
      create: { key: section, value: values },
      update: { value: values },
      select: { key: true, value: true, updatedAt: true },
    });
    return NextResponse.json({ key: saved.key, value: saved.value, updatedAt: saved.updatedAt });
  } catch (error) {
    console.error("Failed to save platform settings", error);
    return NextResponse.json({ error: "Failed to save platform settings" }, { status: 500 });
  }
}
