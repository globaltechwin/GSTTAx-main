"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  DatabaseBackup,
  RefreshCw,
  Search,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

type HistoryType = "import" | "export" | "backup";
type WorkspaceInfo = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
} | null;
type HistoryRecord = {
  id: number;
  module: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  format?: string;
  status: string;
  user: string;
  createdAt: string;
  imported?: number;
  skipped?: number;
  failed?: number;
  recordCount?: number;
  errorMsg?: string | null;
  workspace?: WorkspaceInfo;
  historyType: HistoryType;
};

const tabs: { id: "all" | HistoryType; label: string }[] = [
  { id: "all", label: "All activity" },
  { id: "import", label: "Imports" },
  { id: "export", label: "Exports" },
  { id: "backup", label: "Backups" },
];

const typeLabels: Record<HistoryType, string> = {
  import: "Import",
  export: "Export",
  backup: "Backup",
};

function workspaceName(workspace?: WorkspaceInfo) {
  if (!workspace) return "Unknown workspace";
  const fullName = `${workspace.firstName || ""} ${workspace.lastName || ""}`.trim();
  return fullName ? `${fullName} (@${workspace.username})` : `@${workspace.username}`;
}

function statusStyle(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "success" || normalized === "completed") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (normalized === "failed" || normalized === "error") {
    return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
  }
  return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
}

export function PlatformImportExport() {
  const [activeTab, setActiveTab] = useState<"all" | HistoryType>("all");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const types: HistoryType[] = activeTab === "all" ? ["import", "export", "backup"] : [activeTab];
      const responses = await Promise.all(
        types.map(async (type) => {
          const params = new URLSearchParams({ type, page: "1", pageSize: "100" });
          if (search.trim()) params.set("search", search.trim());
          const response = await fetch(`/api/history?${params.toString()}`, { cache: "no-store" });
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `Unable to load ${type} history`);
          }
          const body = await response.json();
          return (body.data || []).map((item: Omit<HistoryRecord, "historyType">) => ({
            ...item,
            historyType: type,
          })) as HistoryRecord[];
        })
      );
      setRecords(responses.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : "Unable to load platform history");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadHistory(), 250);
    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  const counts = useMemo(() => ({
    imports: records.filter((record) => record.historyType === "import").length,
    exports: records.filter((record) => record.historyType === "export").length,
    backups: records.filter((record) => record.historyType === "backup").length,
  }), [records]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Platform Import / Export</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Superadmin</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Monitor import, export and backup activity across Admin workspaces.</p>
        </div>
        <button type="button" onClick={() => void loadHistory()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Platform-wide, read-only monitoring</p>
          <p className="mt-1 text-blue-800/90 dark:text-blue-200/80">Superadmin can review activity from all Admin workspaces. Tenant imports and business-data changes remain restricted to each workspace to protect data ownership.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Imports loaded</span><ArrowDownToLine className="h-4 w-4" /></div><p className="mt-2 text-2xl font-semibold tabular-nums">{counts.imports}</p></div>
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Exports loaded</span><ArrowUpFromLine className="h-4 w-4" /></div><p className="mt-2 text-2xl font-semibold tabular-nums">{counts.exports}</p></div>
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Backups loaded</span><DatabaseBackup className="h-4 w-4" /></div><p className="mt-2 text-2xl font-semibold tabular-nums">{counts.backups}</p></div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search file, module or user..." className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </label>
        </div>

        {error && <div className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Activity / File</th>
                <th className="px-4 py-3 font-medium">Admin workspace</th>
                <th className="px-4 py-3 font-medium">Performed by</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Records</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading platform activity...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><FileSpreadsheet className="mx-auto mb-2 h-6 w-6 opacity-50" />No activity found.</td></tr>
              ) : records.map((record) => (
                <tr key={`${record.historyType}-${record.id}`} className="hover:bg-muted/30">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="rounded-md bg-muted p-2">{record.historyType === "import" ? <ArrowDownToLine className="h-4 w-4" /> : record.historyType === "export" ? <ArrowUpFromLine className="h-4 w-4" /> : <DatabaseBackup className="h-4 w-4" />}</span><div><p className="max-w-[230px] truncate font-medium" title={record.fileName}>{record.fileName}</p><p className="text-xs text-muted-foreground">{typeLabels[record.historyType]} · {record.fileType || record.format || "File"} · {record.fileSize}</p></div></div></td>
                  <td className="px-4 py-3"><span className="font-medium">{workspaceName(record.workspace)}</span>{record.workspace && <p className="text-xs text-muted-foreground">Workspace #{record.workspace.id}</p>}</td>
                  <td className="px-4 py-3">{record.user || "—"}</td>
                  <td className="px-4 py-3 capitalize">{record.module.replace(/-/g, " ")}</td>
                  <td className="px-4 py-3 tabular-nums">{record.historyType === "import" ? `${record.imported ?? 0} imported · ${record.skipped ?? 0} skipped · ${record.failed ?? 0} failed` : record.recordCount ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(record.status)}`}>{record.status.toLowerCase() === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{record.status}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(record.createdAt).toLocaleString()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">Showing up to 100 records per activity type. History is filtered to Admin workspaces by the server.</div>
      </div>
    </div>
  );
}
