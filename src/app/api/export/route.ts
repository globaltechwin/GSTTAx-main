import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { exportData, type ExportModule, type ExportFormat } from "@/lib/services/export-service";
import { prisma } from "@/lib/db";

const VALID_MODULES: ExportModule[] = [
  "companies",
  "to-companies",
  "invoices",
  "referrals",
];
const VALID_FORMATS: ExportFormat[] = ["excel", "csv", "json"];
const isExportModule = (value: unknown): value is ExportModule =>
  typeof value === "string" && VALID_MODULES.includes(value as ExportModule);
const isExportFormat = (value: unknown): value is ExportFormat =>
  typeof value === "string" && VALID_FORMATS.includes(value as ExportFormat);

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "import-export", "export", true);
  if (access instanceof NextResponse) return access;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid export request" }, { status: 400 });
    }
    const { module, format, dateFrom, dateTo, companyId } = body as Record<string, unknown>;

    if (!isExportModule(module)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    if (!isExportFormat(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const validDate = (value: unknown) =>
      value === undefined || value === "" || (typeof value === "string" && !Number.isNaN(new Date(value).getTime()));
    if (!validDate(dateFrom) || !validDate(dateTo)) {
      return NextResponse.json({ error: "Invalid export date range" }, { status: 400 });
    }
    if (
      typeof dateFrom === "string" &&
      typeof dateTo === "string" &&
      dateFrom &&
      dateTo &&
      new Date(dateFrom) > new Date(dateTo)
    ) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    let parsedCompanyId: number | undefined;
    if (companyId !== undefined && companyId !== null && companyId !== "") {
      parsedCompanyId = Number(companyId);
      if (!Number.isSafeInteger(parsedCompanyId) || parsedCompanyId < 1) {
        return NextResponse.json({ error: "Invalid company filter" }, { status: 400 });
      }
      const company = await prisma.company.findFirst({
        where: { id: parsedCompanyId, adminId: access.user.workspaceId },
        select: { id: true },
      });
      if (!company) {
        return NextResponse.json({ error: "Company filter is unavailable" }, { status: 400 });
      }
    }

    const result = await exportData(
      module,
      format,
      {
        dateFrom: typeof dateFrom === "string" ? dateFrom : undefined,
        dateTo: typeof dateTo === "string" ? dateTo : undefined,
        companyId: parsedCompanyId,
      },
      access.user.username,
      access.user.workspaceId!
    );

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-Export-Record-Count": String(result.recordCount),
        "X-Export-History-Id": String(result.historyId),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
