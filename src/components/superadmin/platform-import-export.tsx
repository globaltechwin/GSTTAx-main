"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  id: number;
  module: string;
  fileName: string;
  status: string;
  recordCount: number;
  createdAt: string;
  workspace: { id: number; username: string; firstName: string; lastName: string } | null;
}

const historyTypes = ["import", "export", "backup"] as const;

export function PlatformImportExport() {
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all(
      historyTypes.map(async (type) => {
        const response = await fetch(`/api/history?type=${type}&page=1&pageSize=100`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Unable to load ${type} history`);
        return [type, result.data as HistoryEntry[]] as const;
      })
    )
      .then((results) => {
        if (active) setHistory(Object.fromEntries(results));
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load history");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Import/Export activity</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Read-only history across Admin workspaces.
        </p>
      </div>
      {error && <p className="text-destructive rounded-lg border p-3 text-sm" role="alert">{error}</p>}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading workspace activity...</p>
      ) : (
        historyTypes.map((type) => {
          const entries = history[type] ?? [];
          return (
            <section key={type} className="border-border/60 bg-card overflow-hidden rounded-xl border">
              <h2 className="border-border/60 border-b p-4 font-semibold capitalize">{type} history</h2>
              {entries.length === 0 ? (
                <p className="text-muted-foreground p-4 text-sm">No {type} history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">File</th>
                        <th className="px-4 py-3 font-medium">Module</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Records</th>
                        <th className="px-4 py-3 font-medium">Workspace</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-border/60 divide-y">
                      {entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="text-foreground px-4 py-3">{entry.fileName}</td>
                          <td className="text-muted-foreground px-4 py-3">{entry.module}</td>
                          <td className="text-muted-foreground px-4 py-3">{entry.status}</td>
                          <td className="text-muted-foreground px-4 py-3">{entry.recordCount}</td>
                          <td className="text-muted-foreground px-4 py-3">
                            {entry.workspace
                              ? `${entry.workspace.firstName} ${entry.workspace.lastName} (@${entry.workspace.username}, #${entry.workspace.id})`
                              : "Unassigned"}
                          </td>
                          <td className="text-muted-foreground px-4 py-3">
                            {new Date(entry.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
