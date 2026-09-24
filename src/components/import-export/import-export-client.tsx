"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeftRight,
  Upload,
  Download,
  Database,
  FileText,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  FileSpreadsheet,
  FileJson,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";

interface HistoryRecord {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: string;
  module: string;
  status: "success" | "failed" | "pending" | "processing";
  user: string;
  createdAt: string;
  imported?: number;
  skipped?: number;
  failed?: number;
  recordCount?: number;
  format?: string;
  errorMsg?: string | null;
}

const modules = [
  { id: "database", label: "Full Database", icon: Database },
  { id: "companies", label: "Companies", icon: FileText },
  { id: "to-companies", label: "To Companies", icon: FileText },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "referrals", label: "Referrals", icon: FileText },
];

const exportFormats = [
  {
    id: "sql",
    label: "SQL",
    icon: FileCode,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    desc: "Database dump file",
  },
  {
    id: "csv",
    label: "CSV",
    icon: FileSpreadsheet,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    desc: "Comma-separated values",
  },
  {
    id: "excel",
    label: "Excel",
    icon: FileSpreadsheet,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    desc: "Microsoft Excel format",
  },
  {
    id: "json",
    label: "JSON",
    icon: FileJson,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    desc: "JSON data format",
  },
];

function formatBytes(kb: string): string {
  const num = parseFloat(kb);
  if (isNaN(num)) return kb;
  if (num >= 1024) return `${(num / 1024).toFixed(2)} MB`;
  return `${num.toFixed(1)} KB`;
}

export function ImportExportClient() {
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDragOver, setImportDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<"idle" | "uploading" | "success" | "error">(
    "idle"
  );
  const [importModule, setImportModule] = useState("database");
  const [importNote, setImportNote] = useState("");
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    failed: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportModule, setExportModule] = useState("database");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success" | "error">(
    "idle"
  );
  const [exportNote, setExportNote] = useState("");

  // Backup state
  const [backupFormat, setBackupFormat] = useState("json");
  const [backupModule, setBackupModule] = useState("database");
  const [backupStatus, setBackupStatus] = useState<"idle" | "backing-up" | "success" | "error">(
    "idle"
  );

  // History state
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historySorting, setHistorySorting] = useState<SortingState>([]);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ type: "import", pageSize: "50" });
      if (historySearch) params.set("search", historySearch);
      const res = await fetch(`/api/history?${params}`);
      if (res.ok) {
        const json = await res.json();
        const importRecords: HistoryRecord[] = (json.data || []).map(
          (r: Record<string, unknown>) => ({
            id: r.id as number,
            fileName: r.fileName as string,
            fileType: r.fileType as string,
            fileSize: r.fileSize as string,
            module: r.module as string,
            status: r.status as string,
            user: r.user as string,
            createdAt: r.createdAt as string,
            imported: r.imported as number,
            skipped: r.skipped as number,
            failed: r.failed as number,
          })
        );

        // Also fetch export and backup history
        const [exportRes, backupRes] = await Promise.all([
          fetch(`/api/history?type=export&pageSize=50`),
          fetch(`/api/history?type=backup&pageSize=50`),
        ]);

        if (exportRes.ok) {
          const exportJson = await exportRes.json();
          const exportRecords: HistoryRecord[] = (exportJson.data || []).map(
            (r: Record<string, unknown>) => ({
              id: r.id as number,
              fileName: r.fileName as string,
              fileType: r.fileType as string,
              fileSize: r.fileSize as string,
              module: r.module as string,
              status: r.status as string,
              user: r.user as string,
              createdAt: r.createdAt as string,
              recordCount: r.recordCount as number,
              format: r.format as string,
            })
          );
          importRecords.push(...exportRecords);
        }

        if (backupRes.ok) {
          const backupJson = await backupRes.json();
          const backupRecords: HistoryRecord[] = (backupJson.data || []).map(
            (r: Record<string, unknown>) => ({
              id: r.id as number,
              fileName: r.fileName as string,
              fileType: r.fileType as string,
              fileSize: r.fileSize as string,
              module: r.module as string,
              status: r.status as string,
              user: r.user as string,
              createdAt: r.createdAt as string,
              recordCount: r.recordCount as number,
              format: r.format as string,
            })
          );
          importRecords.push(...backupRecords);
        }

        importRecords.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistoryData(importRecords);
      }
    } catch {
      // silently fail - history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [historySearch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleImportDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setImportDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }, []);

  const validateAndSetFile = (file: File) => {
    const validTypes = [".sql", ".csv", ".xlsx", ".xls", ".json"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(ext)) {
      setImportNote("Invalid file type. Please upload a SQL, CSV, Excel, or JSON file.");
      setImportStatus("error");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setImportNote("File size exceeds 50MB limit.");
      setImportStatus("error");
      return;
    }
    setImportFile(file);
    setImportNote("");
    setImportStatus("idle");
    setImportResult(null);
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    setImportStatus("uploading");
    setImportProgress(0);
    setImportResult(null);

    const progressInterval = setInterval(() => {
      setImportProgress((prev) => Math.min(prev + Math.random() * 10 + 2, 90));
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("module", importModule);
      formData.append("user", "admin");

      const res = await fetch("/api/import", { method: "POST", body: formData });
      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json();
        setImportStatus("error");
        setImportNote(err.error || "Import failed");
        setImportProgress(0);
        return;
      }

      const result = await res.json();
      setImportProgress(100);
      setImportStatus("success");
      setImportResult({
        imported: result.imported,
        skipped: result.skipped,
        failed: result.failed,
      });
      setImportNote(
        `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`
      );
      setImportFile(null);
      fetchHistory();
    } catch {
      clearInterval(progressInterval);
      setImportStatus("error");
      setImportNote("Network error. Please check your connection and try again.");
      setImportProgress(0);
    }
  };

  const handleExport = async () => {
    setExportStatus("exporting");
    setExportProgress(0);
    setExportNote("");

    const progressInterval = setInterval(() => {
      setExportProgress((prev) => Math.min(prev + Math.random() * 15 + 5, 90));
    }, 200);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: exportModule,
          format: exportFormat,
          dateFrom: exportDateFrom || undefined,
          dateTo: exportDateTo || undefined,
          user: "admin",
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const err = await res.json();
        setExportStatus("error");
        setExportNote(err.error || "Export failed");
        setExportProgress(0);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const fileName =
        disposition?.match(/filename="(.+)"/)?.[1] ||
        `export.${exportFormat === "excel" ? "xlsx" : exportFormat}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setExportStatus("success");
      setExportNote(`Export completed successfully. ${fileName} downloaded.`);
      fetchHistory();
    } catch {
      clearInterval(progressInterval);
      setExportStatus("error");
      setExportNote("Network error during export.");
      setExportProgress(0);
    }
  };

  const handleBackup = async () => {
    setBackupStatus("backing-up");

    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: backupModule, format: backupFormat, user: "admin" }),
      });

      if (!res.ok) {
        const err = await res.json();
        setBackupStatus("error");
        setExportNote(err.error || "Backup failed");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const fileName =
        disposition?.match(/filename="(.+)"/)?.[1] ||
        `backup.${backupFormat === "excel" ? "xlsx" : backupFormat}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupStatus("success");
      setExportNote(`Backup completed. ${fileName} downloaded.`);
      fetchHistory();
    } catch {
      setBackupStatus("error");
      setExportNote("Network error during backup.");
    }
  };

  const historyColumns = [
    {
      id: "srNo",
      header: "Sr.No",
      cell: (info: { row: { index: number } }) => (
        <span className="text-muted-foreground font-medium">{info.row.index + 1}</span>
      ),
      size: 60,
    },
    {
      accessorKey: "fileName" as const,
      header: "File Name",
      cell: (info: { row: { original: HistoryRecord } }) => (
        <span className="text-foreground text-sm font-medium">{info.row.original.fileName}</span>
      ),
    },
    {
      accessorKey: "module" as const,
      header: "Module",
      cell: (info: { row: { original: HistoryRecord } }) => (
        <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
          {info.row.original.module}
        </span>
      ),
    },
    {
      accessorKey: "createdAt" as const,
      header: "Date",
      cell: (info: { row: { original: HistoryRecord } }) => {
        const d = new Date(info.row.original.createdAt);
        return (
          <span className="text-muted-foreground text-sm">
            {d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "status" as const,
      header: "Status",
      cell: (info: { row: { original: HistoryRecord } }) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            info.row.original.status === "success" && "bg-emerald-500/10 text-emerald-600",
            info.row.original.status === "failed" && "bg-red-500/10 text-red-600",
            info.row.original.status === "pending" && "bg-amber-500/10 text-amber-600",
            info.row.original.status === "processing" && "bg-blue-500/10 text-blue-600"
          )}
        >
          {info.row.original.status === "success" && <CheckCircle2 className="size-3" />}
          {info.row.original.status === "failed" && <AlertTriangle className="size-3" />}
          {info.row.original.status === "pending" && <Clock className="size-3" />}
          {info.row.original.status === "processing" && <Clock className="size-3 animate-spin" />}
          {info.row.original.status.charAt(0).toUpperCase() + info.row.original.status.slice(1)}
        </span>
      ),
    },
    {
      accessorKey: "user" as const,
      header: "User",
      cell: (info: { row: { original: HistoryRecord } }) => (
        <span className="text-sm">{info.row.original.user}</span>
      ),
    },
    {
      accessorKey: "fileSize" as const,
      header: "Size",
      cell: (info: { row: { original: HistoryRecord } }) => (
        <span className="text-muted-foreground text-sm">{info.row.original.fileSize}</span>
      ),
    },
  ];

  const table = useReactTable({
    data: historyData,
    columns: historyColumns,
    state: {
      sorting: historySorting,
      globalFilter: historySearch,
      pagination: { pageIndex: 0, pageSize: historyPageSize },
    },
    onSortingChange: setHistorySorting,
    onGlobalFilterChange: setHistorySearch,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <a href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </a>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">Import / Export</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
            <ArrowLeftRight className="text-primary size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight">Import & Export</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage database imports, exports, and backups
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={backupModule}
            onChange={(e) => setBackupModule(e.target.value)}
            className="border-border/60 bg-card focus:ring-primary/20 h-9 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={backupFormat}
            onChange={(e) => setBackupFormat(e.target.value)}
            className="border-border/60 bg-card focus:ring-primary/20 h-9 rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
          <button
            onClick={handleBackup}
            disabled={backupStatus === "backing-up"}
            className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {backupStatus === "backing-up" ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{" "}
                Backing up...
              </>
            ) : (
              <>
                <HardDrive className="size-4" /> Backup Database
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import & Export Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Card */}
        <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10">
              <Upload className="size-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-semibold">Import Database</h2>
              <p className="text-muted-foreground text-xs">
                Upload a file to restore or import data
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">Import Type</label>
              <select
                value={importModule}
                onChange={(e) => setImportModule(e.target.value)}
                className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
              >
                <option value="database">Full Database (SQL)</option>
                <option value="companies">Companies Data</option>
                <option value="to-companies">To Companies Data</option>
                <option value="invoices">Invoice Data</option>
                <option value="referrals">Referral Data</option>
              </select>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setImportDragOver(true);
              }}
              onDragLeave={() => setImportDragOver(false)}
              onDrop={handleImportDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all",
                importDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
              )}
            >
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-2xl transition-colors",
                  importDragOver ? "bg-primary/10" : "bg-muted/50"
                )}
              >
                <Upload
                  className={cn(
                    "size-6",
                    importDragOver ? "text-primary" : "text-muted-foreground/40"
                  )}
                />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-medium">
                  {importFile ? importFile.name : "Drag & drop your file here"}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {importFile
                    ? `${(importFile.size / 1024 / 1024).toFixed(2)} MB`
                    : "or click to browse (SQL, CSV, Excel, JSON)"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql,.csv,.xlsx,.xls,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) validateAndSetFile(f);
                }}
                className="hidden"
              />
            </div>

            {importStatus === "uploading" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Importing...</span>
                  <span className="text-foreground font-medium">
                    {Math.min(Math.round(importProgress), 100)}%
                  </span>
                </div>
                <div className="bg-muted/50 h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(importProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {importResult && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-emerald-500/5 p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{importResult.imported}</p>
                  <p className="text-muted-foreground text-xs">Imported</p>
                </div>
                <div className="rounded-lg bg-amber-500/5 p-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{importResult.skipped}</p>
                  <p className="text-muted-foreground text-xs">Skipped</p>
                </div>
                <div className="rounded-lg bg-red-500/5 p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-muted-foreground text-xs">Failed</p>
                </div>
              </div>
            )}

            {importNote && (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl p-3.5 text-sm",
                  importStatus === "success" &&
                    "border border-emerald-500/20 bg-emerald-500/5 text-emerald-700",
                  importStatus === "error" && "border border-red-500/20 bg-red-500/5 text-red-700"
                )}
              >
                {importStatus === "success" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
                )}
                <span>{importNote}</span>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
              <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p className="text-muted-foreground text-xs">
                Please utilize this correctly as using an imported old database may result in data
                loss! Always create a backup before importing.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleImportSubmit}
                disabled={!importFile || importStatus === "uploading"}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importStatus === "uploading" ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{" "}
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="size-4" /> Submit Import
                  </>
                )}
              </button>
              {importFile && importStatus !== "uploading" && (
                <button
                  onClick={() => {
                    setImportFile(null);
                    setImportStatus("idle");
                    setImportNote("");
                    setImportResult(null);
                  }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
                >
                  <X className="size-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Export Card */}
        <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <Download className="size-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-foreground text-lg font-semibold">Export Database</h2>
              <p className="text-muted-foreground text-xs">Download your data in various formats</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">Export Format</label>
              <div className="grid grid-cols-2 gap-2">
                {exportFormats.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setExportFormat(fmt.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                        exportFormat === fmt.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 hover:border-border hover:bg-muted/20"
                      )}
                    >
                      <div
                        className={cn("flex size-8 items-center justify-center rounded-lg", fmt.bg)}
                      >
                        <Icon className={cn("size-4", fmt.color)} />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            exportFormat === fmt.id ? "text-primary" : "text-foreground"
                          )}
                        >
                          {fmt.label}
                        </p>
                        <p className="text-muted-foreground text-[10px]">{fmt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">Module</label>
              <select
                value={exportModule}
                onChange={(e) => setExportModule(e.target.value)}
                className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-foreground text-sm font-medium">Date Range (Optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">From</label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">To</label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {exportStatus === "exporting" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Exporting...</span>
                  <span className="text-foreground font-medium">
                    {Math.min(Math.round(exportProgress), 100)}%
                  </span>
                </div>
                <div className="bg-muted/50 h-2 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(exportProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {exportNote && (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl p-3.5 text-sm",
                  exportStatus === "success" &&
                    "border border-emerald-500/20 bg-emerald-500/5 text-emerald-700",
                  exportStatus === "error" && "border border-red-500/20 bg-red-500/5 text-red-700"
                )}
              >
                {exportStatus === "success" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
                )}
                <span>{exportNote}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleExport}
                disabled={exportStatus === "exporting"}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportStatus === "exporting" ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{" "}
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="size-4" /> Export Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="border-border/60 bg-card rounded-2xl border shadow-sm">
        <div className="border-border/60 flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-xl">
              <Clock className="text-primary size-5" />
            </div>
            <div>
              <h2 className="text-foreground text-base font-semibold">Import / Export History</h2>
              <p className="text-muted-foreground text-xs">
                Track all past import and export operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Show</span>
            <select
              value={historyPageSize}
              onChange={(e) => setHistoryPageSize(Number(e.target.value))}
              className="border-border/60 bg-card focus:ring-primary/20 h-9 rounded-lg border px-3 text-sm font-medium focus:ring-2 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-muted-foreground text-sm">entries</span>
            <div className="relative ml-2">
              <Search className="text-muted-foreground/50 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                className="border-border/60 bg-card focus:ring-primary/20 h-9 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-all focus:ring-2 focus:outline-none sm:w-56"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch("")}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-border/60 bg-muted/40 border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className={cn(
                            "flex items-center gap-1.5 transition-colors",
                            header.column.getCanSort() && "hover:text-foreground cursor-pointer"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="flex flex-col">
                              {header.column.getIsSorted() === "asc" ? (
                                <ArrowUp className="text-primary size-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ArrowDown className="text-primary size-3" />
                              ) : (
                                <ArrowUpDown className="size-3 opacity-30" />
                              )}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {historyLoading ? (
                <tr>
                  <td colSpan={historyColumns.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="border-primary/30 border-t-primary size-8 animate-spin rounded-full border-2" />
                      <p className="text-muted-foreground text-sm">Loading history...</p>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={historyColumns.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/50 flex size-14 items-center justify-center rounded-2xl">
                        <Clock className="text-muted-foreground/40 size-7" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">No history found</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {historySearch
                            ? "Try adjusting your search terms"
                            : "Import or export data to see history"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-border/40 border-b transition-colors last:border-0",
                      index % 2 === 0
                        ? "hover:bg-muted/30 bg-transparent"
                        : "bg-muted/10 hover:bg-muted/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-3.5 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-border/60 flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Showing{" "}
            <span className="text-foreground font-medium">
              {table.getFilteredRowModel().rows.length === 0
                ? 0
                : table.getState().pagination.pageIndex * historyPageSize + 1}
            </span>{" "}
            to{" "}
            <span className="text-foreground font-medium">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * historyPageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{" "}
            of{" "}
            <span className="text-foreground font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            entries
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            {table.getPageOptions().map((page) => (
              <button
                key={page}
                onClick={() => table.setPageIndex(page)}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                  table.getState().pagination.pageIndex === page
                    ? "bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {page + 1}
              </button>
            ))}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
