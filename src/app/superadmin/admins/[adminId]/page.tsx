"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Building2, FileText, ShoppingCart, Users, UsersRound, Activity } from "lucide-react";

type WorkspacePayload = {
  admin: { id: number; firstName: string; lastName: string; username: string; email: string | null; phone: string | null; status: string; createdAt: string };
  counts: { users: number; companies: number; toCompanies: number; invoices: number; purchases: number; referrals: number };
  users: { id: number; firstName: string; lastName: string; username: string; email: string | null; status: string; createdAt: string }[];
  companies: { id: number; name: string; gstNo: string | null; email: string | null; phone: string | null; address: string | null; state: string | null; status: string; createdAt: string }[];
  toCompanies: { id: number; name: string; gstNo: string | null; email: string | null; state: string | null; createdAt: string }[];
  invoices: { id: number; invoiceNo: string | null; orderId: string; date: string; amount: string | number | null; total: string | number | null; company: { name: string } | null; toCompany: { name: string } | null }[];
  purchases: { id: number; partyName: string; invoiceNo: string; invoiceDate: string; totalAmount: string | number; gstNo: string | null }[];
  referrals: { id: number; name: string; email: string | null; mobile: string | null; createdAt: string }[];
  activity: { id: number; action: string; createdAt: string; actor: string; actorName: string }[];
  limit: number;
};

const money = (value: string | number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value));
const date = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function WorkspaceExplorerPage() {
  const params = useParams<{ adminId: string }>();
  const [data, setData] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/superadmin/admins/${params.adminId}/workspace`, { cache: "no-store" })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to load workspace"); if (active) setData(result); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load workspace"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.adminId]);

  if (loading) return <p className="text-muted-foreground p-6 text-sm">Loading live workspace data…</p>;
  if (error || !data) return <div className="space-y-4"><p role="alert" className="text-destructive rounded-lg border border-red-200 bg-red-50 p-3 text-sm">{error || "Workspace not found"}</p><Link href="/superadmin/admins" className="text-primary inline-flex items-center gap-2 text-sm"><ArrowLeft className="size-4" />Back to Admin Workspaces</Link></div>;

  const cards = [
    { label: "Users", value: data.counts.users, icon: Users }, { label: "Companies", value: data.counts.companies, icon: Building2 },
    { label: "To Companies", value: data.counts.toCompanies, icon: UsersRound }, { label: "Invoices", value: data.counts.invoices, icon: FileText },
    { label: "Purchases", value: data.counts.purchases, icon: ShoppingCart }, { label: "Referrals", value: data.counts.referrals, icon: Activity },
  ];
  return <div className="space-y-6">
    <Link href="/superadmin/admins" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"><ArrowLeft className="size-4" />Back to Admin Workspaces</Link>
    <header><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-foreground text-2xl font-bold">Workspace Explorer</h1><p className="text-muted-foreground mt-1 text-sm">Read-only live data for {data.admin.firstName} {data.admin.lastName} (@{data.admin.username}).</p></div><span className="rounded-full border px-3 py-1 text-sm capitalize">{data.admin.status}</span></div><div className="text-muted-foreground mt-3 text-sm">{data.admin.email || "No email"} · Created {date(data.admin.createdAt)} · Admin ID {data.admin.id}</div></header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="border-border/60 bg-card rounded-xl border p-4"><div className="text-muted-foreground flex items-center gap-2 text-sm"><Icon className="size-4" />{label}</div><p className="text-foreground mt-2 text-2xl font-bold">{value}</p></div>)}</section>
    <p className="text-muted-foreground rounded-lg border p-3 text-sm">Read-only platform inspection. Lists show up to {data.limit} newest records per section. No workspace records can be edited or deleted here.</p>
    <Section title="Companies"><Table headers={["Company", "GSTIN", "Email", "Phone", "State", "Status"]} rows={data.companies.map((x) => [x.name, x.gstNo, x.email, x.phone, x.state, x.status])} /></Section>
    <Section title="To Companies"><Table headers={["Name", "GSTIN", "Email", "State", "Created"]} rows={data.toCompanies.map((x) => [x.name, x.gstNo, x.email, x.state, date(x.createdAt)])} /></Section>
    <Section title="Invoices"><Table headers={["Invoice", "Date", "Company", "Customer", "Taxable amount", "Total"]} rows={data.invoices.map((x) => [x.invoiceNo || x.orderId, date(x.date), x.company?.name, x.toCompany?.name, money(x.amount), money(x.total)])} /></Section>
    <Section title="Purchases"><Table headers={["Party", "Invoice", "Date", "GSTIN", "Total"]} rows={data.purchases.map((x) => [x.partyName, x.invoiceNo, date(x.invoiceDate), x.gstNo, money(x.totalAmount)])} /></Section>
    <Section title="Users"><Table headers={["Name", "Username", "Email", "Status", "Created"]} rows={data.users.map((x) => [`${x.firstName} ${x.lastName}`, x.username, x.email, x.status, date(x.createdAt)])} /></Section>
    <Section title="Referrals"><Table headers={["Name", "Email", "Mobile", "Created"]} rows={data.referrals.map((x) => [x.name, x.email, x.mobile, date(x.createdAt)])} /></Section>
    <Section title="Recent activity"><Table headers={["Action", "Actor", "Username", "Date"]} rows={data.activity.map((x) => [x.action, x.actorName, x.actor, new Date(x.createdAt).toLocaleString()])} /></Section>
  </div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="border-border/60 bg-card overflow-hidden rounded-xl border"><h2 className="border-border/60 border-b p-4 font-semibold">{title}</h2>{children}</section>; }
function Table({ headers, rows }: { headers: string[]; rows: (string | number | null | undefined)[][] }) { return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/40 text-muted-foreground"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">{header}</th>)}</tr></thead><tbody className="divide-border/60 divide-y">{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((value, cell) => <td key={cell} className="text-foreground max-w-72 px-4 py-3">{value == null || value === "" ? "—" : String(value)}</td>)}</tr>) : <tr><td colSpan={headers.length} className="text-muted-foreground px-4 py-6 text-center">No records found.</td></tr>}</tbody></table></div>; }
