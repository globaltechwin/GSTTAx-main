"use client";

import { useEffect, useState } from "react";

interface PlatformStats {
  adminCount: number;
  activeAdminCount: number;
  inactiveAdminCount: number;
  userCount: number;
  activeUserCount: number;
  inactiveUserCount: number;
  companyCount: number;
  invoiceCount: number;
  purchaseCount: number;
  recentActivity: {
    id: number;
    action: string;
    actor: string;
    actorName: string;
    adminId: number | null;
    createdAt: string;
  }[];
}

type CountKey = Exclude<
  keyof PlatformStats,
  "inactiveAdminCount" | "inactiveUserCount" | "recentActivity"
>;

const statisticCards: { key: CountKey; label: string }[] = [
  { key: "adminCount", label: "Admin workspaces" },
  { key: "activeAdminCount", label: "Active Admins" },
  { key: "userCount", label: "Subordinate Users" },
  { key: "activeUserCount", label: "Active Users" },
  { key: "companyCount", label: "Companies" },
  { key: "invoiceCount", label: "Invoices" },
  { key: "purchaseCount", label: "Purchases" },
];

export default function SuperadminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/superadmin/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load platform statistics");
        setStats(result);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load statistics");
      });
  }, []);

  return (
    <>
      <div>
        <h1 className="text-foreground text-2xl font-bold">Platform overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live counts across all Admin workspaces.
        </p>
      </div>
      {error && (
        <p
          className="text-destructive rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      )}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statisticCards.map((card) => (
          <div key={card.key} className="border-border/60 bg-card rounded-xl border p-5">
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-foreground mt-2 text-2xl font-bold">
              {stats ? stats[card.key] : "—"}
            </p>
          </div>
        ))}
      </section>
      {stats && (
        <p className="text-muted-foreground text-sm">
          Inactive Admins: {stats.inactiveAdminCount} · Inactive Users: {stats.inactiveUserCount}
        </p>
      )}
      <section className="border-border/60 bg-card overflow-hidden rounded-xl border">
        <div className="border-border/60 border-b p-5">
          <h2 className="text-foreground font-semibold">Recent security-sensitive activity</h2>
        </div>
        {!stats ? (
          <p className="text-muted-foreground p-5 text-sm">Loading activity...</p>
        ) : stats.recentActivity.length === 0 ? (
          <p className="text-muted-foreground p-5 text-sm">No recent activity.</p>
        ) : (
          <ul className="divide-border/60 divide-y">
            {stats.recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span className="text-foreground">
                  {entry.actorName} ({entry.actor}) — {entry.action}
                  {entry.adminId ? ` · Admin workspace ${entry.adminId}` : ""}
                </span>
                <time className="text-muted-foreground" dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
