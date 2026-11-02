import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { createBackup, type BackupModule, type BackupFormat } from "@/lib/services/backup-service";

const VALID_MODULES: BackupModule[] = [
  "companies",
  "to-companies",
  "invoices",
  "referrals",
];
const VALID_FORMATS: BackupFormat[] = ["excel", "csv", "json"];

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "settings", "create", true);
  if (access instanceof NextResponse) return access;
  try {
    const body = await request.json();
    const { module, format } = body;

    if (!module || !VALID_MODULES.includes(module)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    if (!format || !VALID_FORMATS.includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const result = await createBackup(
      module,
      format,
      access.user.username,
      access.user.workspaceId!
    );

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "X-Backup-Record-Count": String(result.recordCount),
        "X-Backup-History-Id": String(result.historyId),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
