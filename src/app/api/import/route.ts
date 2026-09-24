import { NextRequest, NextResponse } from "next/server";
import { importData, type ImportModule } from "@/lib/services/import-service";

const VALID_MODULES: ImportModule[] = [
  "database",
  "companies",
  "to-companies",
  "invoices",
  "referrals",
];
const VALID_TYPES = [".sql", ".csv", ".xlsx", ".xls", ".json"];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const importModule = formData.get("module") as string;
    const user = (formData.get("user") as string) || "admin";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!importModule || !VALID_MODULES.includes(importModule as ImportModule)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!VALID_TYPES.includes(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: SQL, CSV, Excel, JSON" },
        { status: 400 }
      );
    }

    const fileType = ext.replace(".", "");
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await importData(buffer, fileType, importModule as ImportModule, user);

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
