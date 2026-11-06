"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import {
  Activity, Building2, CalendarDays, Eye, FileText, Layers3, RefreshCw,
  ShieldCheck, ShoppingCart, Users, UserRoundCheck,
} from "lucide-react";

type TrendPoint = { date: string; label: string; invoices: number; purchases: number };
type AdminRow = {
  id: number; firstName: string; lastName: string; username: string;
  email: string | null; status: string; createdAt: string;
  modules: string[]; userCount: number; companyCount: number;
  invoiceCount: number; purchaseCount: number;
};
type ActivityRow = {
  id: number; action: string; actor: string; actorName: string;
  adminId: number | null; createdAt: string;
};
type DashboardData = {
  updatedAt: string; adminCount: number; activeAdminCount: number;
  inactiveAdminCount: number; userCount: number; activeUserCount: number;
  inactiveUserCount: number; companyCount: number; invoiceCount: number;
  proformaInvoiceCount: number; purchaseCount: number; toCompanyCount: number;
  referralCount: number; vendorCount: number; purchaseOrderCount: number;
  deliveryChallanCount: number;
  moduleBreakdown: { key: string; label: string; count: number }[];
  trend: TrendPoint[]; admins: AdminRow[]; recentActivity: ActivityRow[];
};

const palette = ["#1684f8", "#8b45ef", "#10b981", "#f59e0b", "#36bafa"];
const number = (value: number) => new Intl.NumberFormat("en-IN").format(value);
const dateLabel = (value: string) => new Date(value).toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric",
});
const actionLabel = (action: string) => action.replaceAll(".", " ").replaceAll("_", " ");

function MetricCard({ title, value, note, icon: Icon, color }: {
  title: string; value: number; note: string; icon: ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ color, backgroundColor: `${color}16` }}>
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600">{title}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950">{number(value)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function ActivityChart({ points }: { points: TrendPoint[] }) {
  const width = 560, height = 210, left = 30, right = 12, top = 12, bottom = 28;
  const max = Math.max(1, ...points.flatMap((point) => [point.invoices, point.purchases]));
  const x = (index: number) => left + (points.length <= 1 ? 0 : index * (width - left - right) / (points.length - 1));
  const y = (value: number) => top + (max - value) * (height - top - bottom) / max;
  const line = (key: "invoices" | "purchases") => points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");
  return (
    <div className="w-full">
      <div className="mb-3 flex justify-end gap-4 text-xs font-medium text-slate-600">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-600" />Invoices</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Purchases</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Invoices and purchases created over the last seven days">
        {Array.from({ length: 5 }, (_, i) => {
          const value = Math.ceil(max * (4 - i) / 4);
          const yy = top + i * (height - top - bottom) / 4;
          return <g key={i}><line x1={left} x2={width - right} y1={yy} y2={yy} stroke="#e5edf7" strokeDasharray="4 4" /><text x="3" y={yy + 4} fontSize="10" fill="#64748b">{value}</text></g>;
        })}
        <polyline points={line("invoices")} fill="none" stroke="#1677f5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line("purchases")} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <g key={point.date}>
          <circle cx={x(index)} cy={y(point.invoices)} r="4" fill="white" stroke="#1677f5" strokeWidth="2.5" />
          <circle cx={x(index)} cy={y(point.purchases)} r="4" fill="white" stroke="#10b981" strokeWidth="2.5" />
          <text x={x(index)} y={height - 6} textAnchor="middle" fontSize="10" fill="#475569">{point.label}</text>
        </g>)}
      </svg>
    </div>
  );
}

export default function SuperadminOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/superadmin/dashboard", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load platform data");
      setData(result as DashboardData);
      setUpdatedAt(result.updatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load platform data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const totalRecords = useMemo(() => data ? data.moduleBreakdown.reduce((sum, item) => sum + item.count, 0) : 0, [data]);
  const donut = useMemo(() => {
    if (!data || totalRecords === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
    let current = 0;
    const parts = data.moduleBreakdown.map((item, index) => {
      const start = current;
      current += item.count / totalRecords * 360;
      return `${palette[index]} ${start}deg ${current}deg`;
    });
    return `conic-gradient(${parts.join(",")})`;
  }, [data, totalRecords]);

  return (
    <div className="space-y-5">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 p-5 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Layers3 size={30} /></span>
          <div><h1 className="text-xl font-bold sm:text-2xl">Platform Overview</h1><p className="mt-1 text-sm text-blue-100">Live summary and activity across all admin workspaces (websites).</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-blue-100">{updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString("en-IN")}` : "Live platform data"}</span>
          <button onClick={() => void loadDashboard()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Live Data
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <MetricCard title="Admin Workspaces" value={data?.adminCount ?? 0} note="Total websites (tenants)" icon={Users} color="#1684f8" />
        <MetricCard title="Active Admins" value={data?.activeAdminCount ?? 0} note="Currently active" icon={ShieldCheck} color="#10b981" />
        <MetricCard title="Subordinate Users" value={data?.userCount ?? 0} note="Users under all admins" icon={Users} color="#8b45ef" />
        <MetricCard title="Active Users" value={data?.activeUserCount ?? 0} note="Currently active users" icon={UserRoundCheck} color="#1684f8" />
        <MetricCard title="Companies" value={data?.companyCount ?? 0} note="Total companies" icon={Building2} color="#f59e0b" />
        <MetricCard title="Invoices" value={data?.invoiceCount ?? 0} note="Tax invoices" icon={FileText} color="#e11d48" />
        <MetricCard title="Purchases" value={data?.purchaseCount ?? 0} note="Total purchases" icon={ShoppingCart} color="#0d9488" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr_1.05fr]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2"><Activity className="text-blue-600" size={21} /><h2 className="font-bold text-slate-900">Business Activity Trend</h2></div>
          <p className="mb-2 text-xs text-slate-500">Invoices and purchases created across all workspaces · last 7 days</p>
          {data ? <ActivityChart points={data.trend} /> : <div className="flex h-48 items-center justify-center text-sm text-slate-400">{loading ? "Loading live chart..." : "No trend data available"}</div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2"><Layers3 className="text-blue-600" size={21} /><h2 className="font-bold text-slate-900">Records by Module</h2></div>
          <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
            <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: donut }}>
              <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white"><strong className="text-3xl text-slate-900">{number(totalRecords)}</strong><span className="text-xs text-slate-500">Total records</span></div>
            </div>
            <div className="w-full space-y-3">
              {data?.moduleBreakdown.map((item, index) => <div key={item.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 text-slate-700"><i className="h-2.5 w-2.5 rounded-full" style={{ background: palette[index] }} />{item.label}</span>
                <strong className="whitespace-nowrap text-slate-900">{number(item.count)} ({totalRecords ? (item.count / totalRecords * 100).toFixed(1) : "0.0"}%)</strong>
              </div>)}
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">Others includes To Companies, Proforma Invoices, Delivery Challans, Vendors, Purchase Orders and Referrals.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Activity className="text-blue-600" size={21} /><h2 className="font-bold text-slate-900">Recent Security-Sensitive Activity</h2></div>
          <div className="space-y-3">
            {data?.recentActivity.length ? data.recentActivity.slice(0, 4).map((entry) => <div key={entry.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Users size={17} /></span>
              <div className="min-w-0 flex-1"><p className="text-xs font-semibold capitalize text-slate-800">{actionLabel(entry.action)}</p><p className="mt-0.5 text-[11px] text-slate-500">{entry.adminId ? `Admin workspace ${entry.adminId}` : "Platform"} · by {entry.actorName || entry.actor}</p></div>
              <time className="whitespace-nowrap text-[10px] text-slate-400">{new Date(entry.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</time>
            </div>) : <p className="py-6 text-center text-xs text-slate-400">{loading ? "Loading activity..." : "No recent activity recorded."}</p>}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">Showing the latest 4 audit events</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div><div className="flex items-center gap-2"><Building2 className="text-blue-600" size={21} /><h2 className="font-bold text-slate-900">Admin Workspaces</h2></div><p className="mt-1 text-xs text-slate-500">All registered admin workspaces (websites), using live database records.</p></div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{data?.admins.length ?? 0} workspaces</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-600">
              <tr>{["#","Admin Name","Username","Email","Companies","Invoices","Purchases","Users","Status","Created On","Actions"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.admins.map((admin, index) => <tr key={admin.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{admin.firstName} {admin.lastName}</td>
                <td className="px-4 py-3 text-slate-700">@{admin.username}</td>
                <td className="px-4 py-3 text-slate-600">{admin.email || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{number(admin.companyCount)}</td>
                <td className="px-4 py-3 text-slate-700">{number(admin.invoiceCount)}</td>
                <td className="px-4 py-3 text-slate-700">{number(admin.purchaseCount)}</td>
                <td className="px-4 py-3 text-slate-700">{number(admin.userCount)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${admin.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{admin.status === "active" ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">{dateLabel(admin.createdAt)}</td>
                <td className="px-4 py-3"><Link href={`/superadmin/admins/${admin.id}`} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-blue-100 hover:text-blue-800"><Eye size={13} /> View</Link></td>
              </tr>)}
              {!data?.admins.length && <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400">{loading ? "Loading admin workspaces..." : "No admin workspaces found."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
          <span>Inactive admins: {data?.inactiveAdminCount ?? "—"} · Inactive users: {data?.inactiveUserCount ?? "—"}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> Live database snapshot</span>
        </div>
      </section>
    </div>
  );
}
