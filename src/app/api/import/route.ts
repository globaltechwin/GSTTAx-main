import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { importData, type ImportModule } from "@/lib/services/import-service";

const VALID_MODULES: ImportModule[] = [
  "companies",
  "to-companies",
  "referrals",
];
const VALID_TYPES = [".csv", ".xlsx", ".xls", ".json"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  const access = await requireApiAccess(request, "import-export", "import", true);
  if (access instanceof NextResponse) return access;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const importModule = formData.get("module");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof importModule !== "string" || !VALID_MODULES.includes(importModule as ImportModule)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!VALID_TYPES.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: CSV, Excel, JSON" },
        { status: 400 }
      );
    }

    const fileType = ext.replace(".", "");
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await importData(
      buffer,
      fileType,
      importModule as ImportModule,
      access.user.username,
      access.user.workspaceId!
    );

    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
      errors: result.errors,
      historyId: result.historyId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
