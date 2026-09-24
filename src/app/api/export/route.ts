import { NextRequest, NextResponse } from "next/server";
import { exportData, type ExportModule, type ExportFormat } from "@/lib/services/export-service";

const VALID_MODULES: ExportModule[] = [
  "database",
  "companies",
  "to-companies",
  "invoices",
  "referrals",
];
const VALID_FORMATS: ExportFormat[] = ["excel", "csv", "json"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, format, dateFrom, dateTo, companyId, user } = body;

    if (!module || !VALID_MODULES.includes(module)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    if (!format || !VALID_FORMATS.includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const result = await exportData(
      module,
      format,
      { dateFrom, dateTo, companyId },
      user || "admin"
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
