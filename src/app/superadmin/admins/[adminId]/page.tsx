"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity, ArrowLeft, BadgeCheck, Bell, Building2, CalendarDays, CheckCircle2, ClipboardList,
  Download, Eye, FileText, Hash, Info, Mail, Package, ReceiptText, Share2, ShoppingCart,
  Truck, Users, UsersRound, Wallet,
} from "lucide-react";

type Row = Record<string, string | number | null | undefined>;
type WorkspacePayload = {
  admin: { id: number; firstName: string; lastName: string; username: string; email: string | null; phone: string | null; status: string; createdAt: string };
  modules: string[];
  counts: { users: number; companies: number; toCompanies: number; invoices: number; proformaInvoices: number; purchases: number; referrals: number; vendors: number; purchaseOrders: number; deliveryChallans: number };
  users: Row[]; companies: Row[]; toCompanies: Row[]; invoices: Row[]; proformaInvoices: Row[]; purchases: Row[]; referrals: Row[]; vendors: Row[]; purchaseOrders: Row[]; deliveryChallans: Row[]; activity: Row[]; limit: number;
};

type TabKey = "companies" | "toCompanies" | "invoices" | "proformaInvoices" | "purchases" | "purchaseOrders" | "vendors" | "deliveryChallans" | "users" | "referrals" | "activity";
const money = (value: unknown) => value == null || value === "" ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
const date = (value: unknown) => value ? new Date(String(value)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard", companies: "Companies", "to-companies": "To Companies", invoices: "Invoices", "proforma-invoices": "Proforma Invoice",
  "delivery-challans": "Delivery Challan", purchases: "Purchases", vendors: "Vendors", "purchase-orders": "Purchase Orders",
  "turnover-report": "Turnover Report", referrals: "Referrals", "import-export": "Import Export", users: "Users", settings: "Settings",
};
const tabs: { key: TabKey; label: string; icon: typeof Building2; count: (c: WorkspacePayload["counts"]) => number }[] = [
  { key: "companies", label: "Companies", icon: Building2, count: c => c.companies },
  { key: "toCompanies", label: "To Companies", icon: Share2, count: c => c.toCompanies },
  { key: "invoices", label: "Invoices", icon: FileText, count: c => c.invoices },
  { key: "proformaInvoices", label: "Proforma Invoice", icon: ReceiptText, count: c => c.proformaInvoices },
  { key: "purchases", label: "Purchases", icon: ShoppingCart, count: c => c.purchases },
  { key: "purchaseOrders", label: "Purchase Orders", icon: ClipboardList, count: c => c.purchaseOrders },
  { key: "vendors", label: "Vendors", icon: Package, count: c => c.vendors },
  { key: "deliveryChallans", label: "Delivery Challan", icon: Truck, count: c => c.deliveryChallans },
  { key: "referrals", label: "Referrals", icon: Activity, count: c => c.referrals },
  { key: "users", label: "Users", icon: Users, count: c => c.users },
  { key: "activity", label: "Activity", icon: Bell, count: () => 0 },
];

export default function WorkspaceExplorerPage() {
  const params = useParams<{ adminId: string }>();
  const [data, setData] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("companies");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkspace = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`/api/superadmin/admins/${params.adminId}/workspace`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load workspace");
      setData(result as WorkspacePayload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load workspace");
    } finally { setLoading(false); setRefreshing(false); }
  }, [params.adminId]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  const table = useMemo(() => {
    if (!data) return { title: "Companies", headers: [] as string[], rows: [] as (string | number | null | undefined)[][] };
    const map: Record<TabKey, { title: string; headers: string[]; rows: (string | number | null | undefined)[][] }> = {
      companies: { title: "Companies", headers: ["#", "Company", "GSTIN", "Email", "Phone", "State", "Status"], rows: data.companies.map((x, i) => [i + 1, x.name, x.gstNo, x.email, x.phone, x.state, x.status]) },
      toCompanies: { title: "To Companies", headers: ["#", "Name", "GSTIN", "Email", "State", "Created"], rows: data.toCompanies.map((x, i) => [i + 1, x.name, x.gstNo, x.email, x.state, date(x.createdAt)]) },
      invoices: { title: "Invoices", headers: ["#", "Invoice No.", "Date", "Company", "Customer", "Taxable Amount", "Total"], rows: data.invoices.map((x, i) => [i + 1, x.invoiceNo || x.orderId, date(x.date), (x.company as unknown as Row | null)?.name, (x.toCompany as unknown as Row | null)?.name, money(x.amount), money(x.total)]) },
      proformaInvoices: { title: "Proforma Invoices", headers: ["#", "Proforma No.", "Date", "Company", "Customer", "Amount", "Total"], rows: data.proformaInvoices.map((x, i) => [i + 1, x.invoiceNo || x.orderId, date(x.date), (x.company as unknown as Row | null)?.name, (x.toCompany as unknown as Row | null)?.name, money(x.amount), money(x.total)]) },
      purchases: { title: "Purchases", headers: ["#", "Party", "Invoice No.", "Date", "GSTIN", "State", "Total"], rows: data.purchases.map((x, i) => [i + 1, x.partyName, x.invoiceNo, date(x.invoiceDate), x.gstNo, x.state, money(x.totalAmount)]) },
      purchaseOrders: { title: "Purchase Orders", headers: ["#", "PO Number", "Vendor", "GSTIN", "Order Date", "Status", "Grand Total"], rows: data.purchaseOrders.map((x, i) => [i + 1, x.poNumber, x.vendorName, x.gstin, date(x.orderDate), x.status, money(x.grandTotal)]) },
      vendors: { title: "Vendors", headers: ["#", "Vendor", "GSTIN", "Email", "Mobile", "State", "Status"], rows: data.vendors.map((x, i) => [i + 1, x.name, x.gstin, x.email, x.mobile, x.state, x.status]) },
      deliveryChallans: { title: "Delivery Challans", headers: ["#", "Challan No.", "Date", "From Company", "Recipient", "Status"], rows: data.deliveryChallans.map((x, i) => [i + 1, x.challanNumber, date(x.challanDate), x.companyName, x.recipientName, x.status]) },
      referrals: { title: "Referrals", headers: ["#", "Name", "Email", "Mobile", "Created"], rows: data.referrals.map((x, i) => [i + 1, x.name, x.email, x.mobile, date(x.createdAt)]) },
      users: { title: "Users", headers: ["#", "Name", "Username", "Email", "Status", "Created"], rows: data.users.map((x, i) => [i + 1, `${x.firstName ?? ""} ${x.lastName ?? ""}`.trim(), x.username, x.email, x.status, date(x.createdAt)]) },
      activity: { title: "Recent Activity", headers: ["Action", "Actor", "Username", "Date"], rows: data.activity.map(x => [x.action, x.actorName, x.actor, new Date(String(x.createdAt)).toLocaleString("en-IN")]) },
    };
    return map[activeTab];
  }, [data, activeTab]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return table.rows;
    return table.rows.filter(row => row.some(value => String(value ?? "").toLowerCase().includes(term)));
  }, [table.rows, search]);

  const exportCsv = () => {
    const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [table.headers, ...filteredRows].map(row => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `admin-${data?.admin.username ?? "workspace"}-${activeTab}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500">Loading live workspace data…</div>;
  if (error || !data) return <div className="space-y-4"><p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Workspace not found"}</p><Link href="/superadmin/admins" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"><ArrowLeft className="size-4" />Back to Admin Workspaces</Link></div>;

  const cards = [
    { label: "Users", value: data.counts.users, icon: Users, color: "blue" }, { label: "Companies", value: data.counts.companies, icon: Building2, color: "violet" },
    { label: "To Companies", value: data.counts.toCompanies, icon: Share2, color: "green" }, { label: "Invoices", value: data.counts.invoices, icon: FileText, color: "amber" },
    { label: "Purchases", value: data.counts.purchases, icon: ShoppingCart, color: "rose" }, { label: "Referrals", value: data.counts.referrals, icon: Activity, color: "purple" },
  ];
  const colorClasses: Record<string, string> = { blue: "border-sky-100 bg-sky-50/80 text-sky-700", violet: "border-violet-100 bg-violet-50/80 text-violet-700", green: "border-emerald-100 bg-emerald-50/80 text-emerald-700", amber: "border-amber-100 bg-amber-50/80 text-amber-700", rose: "border-rose-100 bg-rose-50/80 text-rose-700", purple: "border-purple-100 bg-purple-50/80 text-purple-700" };

  return <div className="min-w-0 space-y-5 pb-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500"><Link href="/superadmin" className="hover:text-blue-700">Dashboard</Link><span>›</span><Link href="/superadmin/admins" className="hover:text-blue-700">Admin Workspaces</Link><span>›</span><span className="font-semibold text-slate-900">Workspace Explorer</span></div>
      <button type="button" onClick={() => void loadWorkspace(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60"><Activity className={`size-4 ${refreshing ? "animate-spin" : ""}`} />Refresh live data</button>
    </div>

    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#123b91] via-[#1749a7] to-[#1b55b8] px-5 py-5 text-white shadow-md shadow-blue-900/10">
      <div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"><Building2 className="size-8" /></div><div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">Workspace Explorer</h1><p className="mt-1 text-sm text-blue-100">View live business records and activity for a specific Admin workspace.</p></div></div>
      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold ring-1 ring-white/20"><Eye className="size-4" />Read-only View</span>
    </section>

    <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-white via-blue-50/80 to-sky-100/90 p-5 shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-16 size-64 rounded-full border-[28px] border-sky-200/40" /><div className="pointer-events-none absolute -right-14 -top-8 size-56 rounded-full border-[22px] border-blue-300/30" />
      <div className="relative flex flex-wrap items-center gap-5"><div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700 ring-4 ring-white">{`${data.admin.firstName?.[0] ?? "A"}${data.admin.lastName?.[0] ?? ""}`.toUpperCase()}</div>
        <div className="min-w-0 flex-1"><h2 className="text-xl font-bold text-slate-900">{data.admin.firstName} {data.admin.lastName}</h2><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600"><span>{data.admin.email || "No email provided"}</span><span className="hidden text-slate-300 sm:inline">|</span><span>Admin ID: {data.admin.id}</span></div><div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600"><CalendarDays className="size-4" />Created on {date(data.admin.createdAt)}<span className="text-slate-300">·</span><span>@{data.admin.username}</span></div></div>
        <div className="relative flex items-center gap-2 border-l border-blue-200 pl-5"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${data.admin.status.toLowerCase() === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}><span className={`size-2 rounded-full ${data.admin.status.toLowerCase() === "active" ? "bg-emerald-600" : "bg-slate-500"}`} />{data.admin.status}</span></div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{cards.map(({ label, value, icon: Icon, color }) => <div key={label} className={`rounded-xl border p-4 shadow-sm ${colorClasses[color]}`}><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm"><Icon className="size-5" /></span><span className="text-sm font-semibold text-slate-700">{label}</span></div><p className="mt-2 text-3xl font-bold leading-none text-slate-950">{value.toLocaleString("en-IN")}</p></div>)}</section>

    <section className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><Package className="size-5" /></span><div><h2 className="font-bold text-slate-900">Workspace Modules</h2><p className="text-xs text-slate-500">Modules enabled for this Admin workspace.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{data.modules.map(module => <div key={module} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700"><CheckCircle2 className="size-4 shrink-0 text-emerald-600" /><span className="truncate">{moduleLabels[module] || module}</span></div>)}{data.modules.length === 0 && <p className="col-span-full text-sm text-slate-500">No modules are currently enabled.</p>}</div></div>
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm"><div className="flex items-center gap-3"><Info className="size-5 text-blue-600" /><h2 className="font-bold text-slate-900">Workspace Information</h2></div><dl className="mt-3 divide-y divide-blue-100 text-sm"><InfoRow icon={<Mail className="size-4" />} label="Email" value={data.admin.email || "Not provided"} /><InfoRow icon={<CalendarDays className="size-4" />} label="Created On" value={date(data.admin.createdAt)} /><InfoRow icon={<Hash className="size-4" />} label="Admin ID" value={String(data.admin.id)} /><InfoRow icon={<BadgeCheck className="size-4" />} label="Status" value={data.admin.status} status /></dl></div>
    </section>

    <section className="space-y-3">
      <div className="flex gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1.5">{tabs.map(({ key, label, icon: Icon, count }) => <button key={key} type="button" onClick={() => { setActiveTab(key); setSearch(""); }} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${activeTab === key ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}><Icon className="size-4" />{label}<span className={activeTab === key ? "text-blue-100" : "text-slate-400"}>({count(data.counts) || (key === "activity" ? data.activity.length : 0)})</span></button>)}</div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">{table.title}</h2><p className="mt-0.5 text-xs text-slate-500">Live records · {filteredRows.length} shown{search ? " after filtering" : ""}</p></div><div className="flex items-center gap-2"><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${table.title.toLowerCase()}…`} className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-60" /><button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Download className="size-4" />Export</button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600"><tr>{table.headers.map(header => <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredRows.length ? filteredRows.map((row, index) => <tr key={index} className="transition hover:bg-blue-50/40">{row.map((value, cell) => <td key={cell} className="max-w-72 whitespace-nowrap px-4 py-3 text-slate-700">{value == null || value === "" ? "—" : String(value)}</td>)}</tr>) : <tr><td colSpan={table.headers.length} className="px-4 py-12 text-center text-sm text-slate-500">No live records found in this section.</td></tr>}</tbody></table></div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Showing up to {data.limit} latest records. All figures and rows are loaded from this Admin workspace.</div>
      </div>
    </section>
    <p className="flex items-center gap-2 text-xs text-slate-500"><Eye className="size-4" />Superadmin inspection is read-only. Workspace records cannot be changed from this page.</p>
  </div>;
}

function InfoRow({ icon, label, value, status = false }: { icon: ReactNode; label: string; value: string; status?: boolean }) {
  return <div className="grid grid-cols-[24px_1fr_auto] items-center gap-2 py-2.5"><span className="text-slate-500">{icon}</span><dt className="text-slate-600">{label}</dt><dd className="max-w-48 truncate text-right font-semibold text-slate-800">{status ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold capitalize text-emerald-800">{value}</span> : value}</dd></div>;
}
