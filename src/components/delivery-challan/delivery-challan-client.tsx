"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FilePlus2, Search, Printer, Eye, Trash2, Ban, Plus, X, Truck, RefreshCw, Filter, Download, RotateCcw, FileText, IndianRupee, ChevronDown } from "lucide-react";
import { ProductAutocomplete, type WorkspaceProduct } from "@/components/product/product-autocomplete";

type Item = { id?: number; description: string; hsn: string; quantity: string; uom: string };
type Challan = {
  id: number; companyId?: number | null; challanNumber: string; challanDate: string; deliveryDate?: string | null; companyName: string; companyAddress?: string | null; companyGstin?: string | null; companyPhone?: string | null; signatureUrl?: string | null; signatureWidth?: number | null; signatureHeight?: number | null;
  recipientName: string; recipientAddress?: string | null; recipientGstin?: string | null; recipientState?: string | null; poNumber?: string | null; poDate?: string | null; currency: string; stateOfSupply?: string | null; vehicleNumber?: string | null; transporterName?: string | null; reason?: string | null; remarks?: string | null; status: string; cancelReason?: string | null; items: Item[];
};
type Company = { id: number; name: string; gstNo?: string | null; address?: string | null; phone?: string | null; state?: string | null; stateCode?: string | null; signatureUrl?: string | null; signatureWidth?: number | null; signatureHeight?: number | null };
type Recipient = { id: number; name: string; gstNo?: string | null; address?: string | null; state?: string | null };
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const dateText = (value?: string | null) => value ? new Date(value).toLocaleDateString("en-GB") : "—";
const blankItem = (): Item => ({ description: "", hsn: "", quantity: "1", uom: "Pcs" });
const emptyForm = () => ({ challanNumber: "", challanDate: today(), deliveryDate: "", companyId: "", companyName: "", companyAddress: "", companyGstin: "", companyPhone: "", recipientId: "", recipientName: "", recipientAddress: "", recipientGstin: "", recipientState: "", poNumber: "", poDate: "", currency: "INR", stateOfSupply: "", vehicleNumber: "", transporterName: "", reason: "", remarks: "", items: [blankItem()] as Item[] });

function PrintDocument({ challan, company }: { challan: Challan; company?: Company }) {
  return <article className="dc-print mx-auto w-full bg-white px-5 py-5 text-[13px] leading-[1.35] text-[#222]">
    <div className="dc-company-header flex min-h-[76px] items-start justify-between gap-5">
  <div className="min-w-0">
    <div className="mb-1 text-[12px] font-bold">From</div>
    <div className="text-[18px] font-bold">
      {challan.companyName || "—"}
    </div>
    {challan.companyAddress && (
      <div className="whitespace-pre-line text-[12px]">
        {challan.companyAddress}
      </div>
    )}
    {challan.companyGstin && (
      <div className="text-[12px]">GSTIN: {challan.companyGstin}</div>
    )}
    {challan.companyPhone && (
      <div className="text-[12px]">Phone: {challan.companyPhone}</div>
    )}
    {(company?.state || company?.stateCode) && (
      <div className="text-[12px]">
        State: {company?.state || "—"}
        {company?.stateCode ? ` (State Code: ${company.stateCode})` : ""}
      </div>
    )}
  </div>
</div>
    <h2 className="mb-2 mt-2 text-center text-[18px] font-bold">Delivery Challan</h2>
    <section className="grid min-h-[112px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] border border-black px-2 py-2 text-[12px]">
      <div className="pr-3"><b>To</b><div className="font-semibold">{challan.recipientName}</div><div className="whitespace-pre-line">{challan.recipientAddress || ""}</div><div>GSTN: {challan.recipientGstin || "—"}</div></div>
      <div className="pl-2">{[["Delivery Challan No", challan.challanNumber], ["Delivery Challan Date", dateText(challan.challanDate)], ["PO No", challan.poNumber || "—"], ["PO Date", dateText(challan.poDate)], ["Currency", challan.currency || "INR"], ["State of Supply", challan.stateOfSupply || challan.recipientState || "—"]].map(([k,v]) => <div key={k} className="grid grid-cols-[max-content_1fr] gap-x-2"><span>{k} :</span><span>{v}</span></div>)}</div>
    </section>
    <table className="dc-items w-full border-collapse text-center text-[12px]"><colgroup><col style={{width:"11%"}}/><col style={{width:"11%"}}/><col style={{width:"55%"}}/><col style={{width:"11%"}}/><col style={{width:"12%"}}/></colgroup><thead><tr>{["Sl.No", "HSN", "Item Description", "Qty", "UOM"].map(x => <th key={x} className="border border-black px-2 py-1 font-bold">{x}</th>)}</tr></thead><tbody>{challan.items.map((item, i) => <tr key={i}><td className="border border-black px-2 py-2 align-top">{i+1}</td><td className="border border-black px-2 py-2 align-top">{item.hsn || ""}</td><td className="border border-black px-2 py-2 text-left align-top">{item.description}</td><td className="border border-black px-2 py-2 align-top">{item.quantity}</td><td className="border border-black px-2 py-2 align-top">{item.uom}</td></tr>)}</tbody></table>
    <section className="mt-3 text-[12px]"><b>Tax Detail</b><div>GST No. : {challan.companyGstin || ""}</div></section>
    <footer className="mt-8 flex min-h-[115px] justify-end text-right text-[12px]"><div className="flex w-[230px] flex-col items-end"><div>E &amp; OE</div><div className="mt-1">For <b>{challan.companyName || ""}</b></div>{challan.signatureUrl ? <img src={challan.signatureUrl} alt="Authorised signature" style={{ width: `${Math.max(60, Math.min(320, Number(challan.signatureWidth || 160)))}px`, height: `${Math.max(25, Math.min(140, Number(challan.signatureHeight || 60)))}px`, objectFit: "contain", objectPosition: "right bottom" }} /> : <div className="mt-2 h-[48px] w-[170px]" aria-label="Space for authorised signature"/>}<div>Authorised Signatory</div></div></footer>
  </article>;
}

export function DeliveryChallanClient() {
  const pathname = usePathname();
  const isSuperadmin = pathname.startsWith("/superadmin");
  const [rows, setRows] = useState<Challan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [modal, setModal] = useState<"create" | "view" | null>(null);
  const [selected, setSelected] = useState<Challan | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [allowManualChallanNumber, setAllowManualChallanNumber] = useState(false);
  const [manualChallanNumberEdited, setManualChallanNumberEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ total: 0, issued: 0, drafts: 0, cancelled: 0 });
  const canWrite = !isSuperadmin;

  const query = useMemo(() => new URLSearchParams({ search, status, fromDate, toDate, page: "1", pageSize: "100" }), [search, status, fromDate, toDate]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/delivery-challans?${query.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to load challans");
      setRows(json.data || []); setStats(json.stats || { total: 0, issued: 0, drafts: 0, cancelled: 0 });
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load challans"); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (modal !== "create" || editingId || isSuperadmin) return;
    let cancelled = false;
    const query = new URLSearchParams({ documentType: "DELIVERY_CHALLAN", date: form.challanDate });
    fetch(`/api/document-numbers/next?${query.toString()}`).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to preview challan number");
      if (cancelled) return;
      setAllowManualChallanNumber(result.allowManualOverride === true);
      setManualChallanNumberEdited(false);
      setForm((current) => ({ ...current, challanNumber: result.automatic === false ? current.challanNumber : result.nextNumber || current.challanNumber }));
    }).catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to preview challan number"); });
    return () => { cancelled = true; };
  }, [modal, editingId, isSuperadmin, form.challanDate]);
  useEffect(() => {
    if (isSuperadmin) return;
    Promise.all([fetch("/api/companies?page=1&pageSize=100"), fetch("/api/to-companies?page=1&pageSize=100")]).then(async ([a,b]) => {
      const [ca,cb] = await Promise.all([a.json(),b.json()]); setCompanies(ca.data || []); setRecipients(cb.data || []);
    }).catch(() => undefined);
  }, [isSuperadmin]);

  const change = (key: string, value: string) => setForm(old => ({ ...old, [key]: value }));
  const selectCompany = (id: string) => { const c=companies.find(x=>String(x.id)===id); setForm(old=>({...old,companyId:id,companyName:c?.name||"",companyAddress:c?.address||"",companyGstin:c?.gstNo||"",companyPhone:c?.phone||""})); };
  const selectRecipient = (id: string) => { const c=recipients.find(x=>String(x.id)===id); setForm(old=>({...old,recipientId:id,recipientName:c?.name||"",recipientAddress:c?.address||"",recipientGstin:c?.gstNo||"",recipientState:c?.state||"",stateOfSupply:c?.state||old.stateOfSupply})); };
  const updateItem = (index: number, key: keyof Item, value: string) => setForm(old=>({...old,items:old.items.map((it,i)=>i===index?{...it,[key]:value}:it)}));
  const startCreate = () => { setError(""); setEditingId(null); setAllowManualChallanNumber(false); setForm(emptyForm()); setModal("create"); };
  const startEdit = (row: Challan) => {
    setError(""); setEditingId(row.id); setAllowManualChallanNumber(false);
    setForm({ challanNumber: row.challanNumber, challanDate: row.challanDate.slice(0,10), deliveryDate: row.deliveryDate?.slice(0,10)||"", companyId:row.companyId ? String(row.companyId) : "", companyName:row.companyName||"", companyAddress:row.companyAddress||"", companyGstin:row.companyGstin||"", companyPhone:row.companyPhone||"", recipientId:"", recipientName:row.recipientName, recipientAddress:row.recipientAddress||"", recipientGstin:row.recipientGstin||"", recipientState:row.recipientState||"", poNumber:row.poNumber||"", poDate:row.poDate?.slice(0,10)||"", currency:row.currency||"INR", stateOfSupply:row.stateOfSupply||"", vehicleNumber:row.vehicleNumber||"", transporterName:row.transporterName||"", reason:row.reason||"", remarks:row.remarks||"", items:row.items.map(it=>({description:it.description,hsn:it.hsn||"",quantity:String(it.quantity),uom:it.uom||"Pcs"})) });
    setModal("create");
  };
  const save = async (issueNow: boolean) => {
    setSaving(true); setError("");
    try {
      const response = await fetch(editingId ? `/api/delivery-challans/${editingId}` : "/api/delivery-challans", { method: editingId ? "PATCH" : "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, manualNumberOverride: manualChallanNumberEdited, issueNow}) });
      const json=await response.json(); if(!response.ok) throw new Error(json.error||"Unable to save challan");
      setModal(null); await load();
      if(issueNow) { setSelected(json); setModal("view"); }
    } catch(e) { setError(e instanceof Error?e.message:"Unable to save challan"); }
    finally { setSaving(false); }
  };
  const remove = async (row: Challan) => { if(!confirm(`Delete draft ${row.challanNumber}?`)) return; const r=await fetch(`/api/delivery-challans/${row.id}`,{method:"DELETE"}); const j=await r.json(); if(!r.ok){alert(j.error||"Delete failed");return;} await load(); };
  const cancel = async (row: Challan) => { const reason=prompt("Enter cancellation reason:"); if(!reason?.trim()) return; const r=await fetch(`/api/delivery-challans/${row.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel",reason})}); const j=await r.json(); if(!r.ok){alert(j.error||"Cancellation failed");return;} await load(); };
  const exportCsv = async () => {
    try {
      const params = new URLSearchParams({ search, status, fromDate, toDate, format: "csv" });
      const response = await fetch(`/api/delivery-challans?${params.toString()}`);
      if (!response.ok) { const j = await response.json(); throw new Error(j.error || "Export failed"); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `delivery-challans-${today()}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : "Unable to export challans"); }
  };
  const clearFilters = () => { setFromDate(""); setToDate(""); setStatus("all"); setSearch(""); };
  const title = isSuperadmin ? "Platform Delivery Challans" : "Delivery Challan";

  return <div className="space-y-6">
    <nav className="text-muted-foreground flex items-center gap-1.5 text-sm"><span>Home</span><span>›</span><span className="text-foreground font-medium">{title}</span></nav>
    {error && modal !== "create" && <p className="text-destructive rounded-lg border p-3 text-sm" role="alert">{error}</p>}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl"><FileText className="text-primary size-5"/></div><div><h1 className="text-foreground text-xl font-bold tracking-tight">{title}</h1><p className="text-muted-foreground mt-0.5 text-sm">Manage your delivery challans and dispatch records</p></div></div><div className="flex flex-wrap items-center gap-2"><button onClick={()=>setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${showFilters?"border-primary/30 bg-primary/5 text-primary":"border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}><Filter className="size-4"/> Filters</button><button onClick={()=>void exportCsv()} className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium"><Download className="size-4"/> Export</button>{canWrite&&<button onClick={startCreate} className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm"><Plus className="size-4"/> Create Delivery Challan</button>}</div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total Challans" value={stats.total} icon="file"/><Stat label="Issued Challans" value={stats.issued} icon="issued"/><Stat label="Draft Challans" value={stats.drafts} icon="draft"/><Stat label="Cancelled Challans" value={stats.cancelled} icon="cancelled"/></div>
    {showFilters&&<div className="border-border/60 bg-card animate-fade-in rounded-2xl border p-4 shadow-sm"><div className="flex flex-wrap items-end gap-3"><label className="space-y-1"><span className="text-muted-foreground text-xs font-medium">From date</span><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="border-border/60 bg-card h-9 rounded-lg border px-3 text-sm"/></label><label className="space-y-1"><span className="text-muted-foreground text-xs font-medium">To date</span><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="border-border/60 bg-card h-9 rounded-lg border px-3 text-sm"/></label><label className="space-y-1"><span className="text-muted-foreground text-xs font-medium">Status</span><select value={status} onChange={e=>setStatus(e.target.value)} className="border-border/60 bg-card h-9 min-w-36 rounded-lg border px-3 text-sm"><option value="all">All statuses</option><option value="DRAFT">Draft</option><option value="ISSUED">Issued</option><option value="CANCELLED">Cancelled</option></select></label><button onClick={clearFilters} className="text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-1.5 px-2 text-sm"><RotateCcw className="size-3.5"/> Clear filters</button></div></div>}
    <div className="border-border/60 bg-card rounded-2xl border shadow-sm"><div className="border-border/60 flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="text-muted-foreground text-sm">Show</span><div className="relative"><select defaultValue="100" className="border-border/60 bg-card h-9 appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm font-medium"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select><ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2"/></div><span className="text-muted-foreground text-sm">entries</span></div><div className="flex items-center gap-2"><div className="relative"><Search className="text-muted-foreground/50 absolute top-1/2 left-3 size-4 -translate-y-1/2"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search challans..." className="border-border/60 bg-card h-9 w-full rounded-lg border py-2 pr-4 pl-9 text-sm sm:w-64"/></div><button onClick={()=>void load()} title="Refresh" className="border-border/60 text-muted-foreground hover:bg-muted/50 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm"><RefreshCw className="size-3.5"/> Refresh</button></div></div>
      <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-border/60 bg-muted/30 border-b">{["Challan No","Recipient","PO No","Challan Date","Status","Actions"].map(x=><th key={x} className="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase">{x}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading live challans…</td></tr>:rows.length===0?<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No delivery challans found. {canWrite?"Create your first challan to get started.":"No records are available."}</td></tr>:rows.map((row,i)=><tr key={row.id} className="border-border/60 border-b last:border-0 hover:bg-muted/20"><td className="text-foreground px-5 py-3 text-sm font-semibold">{row.challanNumber}</td><td className="text-foreground px-5 py-3 text-sm">{row.recipientName}</td><td className="text-muted-foreground px-5 py-3 text-sm">{row.poNumber||"—"}</td><td className="text-muted-foreground px-5 py-3 text-sm">{dateText(row.challanDate)}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status==="ISSUED"?"bg-emerald-50 text-emerald-700":row.status==="CANCELLED"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"}`}>{row.status}</span></td><td className="px-5 py-3"><div className="flex items-center gap-2"><button title="View / Print" onClick={()=>{setSelected(row);setModal("view");}} className="text-primary rounded-md p-1.5 hover:bg-muted"><Eye className="size-4"/></button>{canWrite&&row.status==="DRAFT"&&<button title="Edit draft" onClick={()=>startEdit(row)} className="text-primary rounded-md p-1.5 hover:bg-muted"><FilePlus2 className="size-4"/></button>}{canWrite&&row.status==="DRAFT"&&<button title="Delete draft" onClick={()=>void remove(row)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="size-4"/></button>}{canWrite&&row.status==="ISSUED"&&<button title="Cancel challan" onClick={()=>void cancel(row)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Ban className="size-4"/></button>}</div></td></tr>)}</tbody></table></div><div className="text-muted-foreground border-border/60 border-t px-5 py-3 text-xs">Showing {rows.length} of {stats.total} live records</div></div>
    {modal==="create"&&<div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/45 p-2 backdrop-blur-[2px] sm:p-4">
      <div className="my-2 flex max-h-[calc(100vh-16px)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:my-4 sm:max-h-[calc(100vh-32px)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Truck className="size-5"/></span><div><h2 className="text-lg font-bold text-slate-900">{editingId?"Edit Delivery Challan":"Create Delivery Challan"}</h2><p className="mt-0.5 text-xs text-slate-500">Create a new delivery challan using your configured document format.</p></div></div><button onClick={()=>setModal(null)} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="size-5"/></button></div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
          <FormSection title="Challan Details" icon={<FileText className="size-4"/>}><div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Delivery Challan No *"><input className="field" value={form.challanNumber} readOnly={!editingId && !allowManualChallanNumber} onChange={e=>{change("challanNumber",e.target.value);setManualChallanNumberEdited(true)}} placeholder="Auto-generated by Admin"/><span className="mt-1 block text-[11px] text-slate-500">{editingId?"You can change this number; it must be unique in this workspace.":allowManualChallanNumber?"Manual numbering is allowed by Admin.":"Auto-generated using Admin settings."}</span></Field><Field label="Challan Date *"><input type="date" className="field" value={form.challanDate} onChange={e=>change("challanDate",e.target.value)}/></Field><Field label="Delivery Date"><input type="date" className="field" value={form.deliveryDate} onChange={e=>change("deliveryDate",e.target.value)}/></Field></div></FormSection>
          <div className="grid gap-4 xl:grid-cols-2">
            <FormSection title="Company Details" icon={<FileText className="size-4"/>}><div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><Field label="Your Company *"><select className="field" value={form.companyId} onChange={e=>selectCompany(e.target.value)}><option value="">Select company</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Company Name"><input className="field" value={form.companyName} onChange={e=>change("companyName",e.target.value)} placeholder="Company name"/></Field><Field label="Company GSTIN"><input className="field" value={form.companyGstin} onChange={e=>change("companyGstin",e.target.value)} placeholder="GSTIN"/></Field><Field label="Phone Number"><input className="field" value={form.companyPhone} onChange={e=>change("companyPhone",e.target.value)} placeholder="Phone number"/></Field><Field label="Company Address" wide><textarea className="field min-h-16" value={form.companyAddress} onChange={e=>change("companyAddress",e.target.value)} placeholder="Registered company address"/></Field></div></FormSection>
            <FormSection title="Recipient Details" icon={<Truck className="size-4"/>}><div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><Field label="Recipient / To Company *"><select className="field" value={form.recipientId} onChange={e=>selectRecipient(e.target.value)}><option value="">Select recipient</option>{recipients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Recipient Name *"><input className="field" value={form.recipientName} onChange={e=>change("recipientName",e.target.value)} placeholder="Recipient name"/></Field><Field label="Recipient GSTIN"><input className="field" value={form.recipientGstin} onChange={e=>change("recipientGstin",e.target.value)} placeholder="GSTIN"/></Field><Field label="Recipient State"><input className="field" value={form.recipientState} onChange={e=>change("recipientState",e.target.value)} placeholder="State"/></Field><Field label="Recipient Address" wide><textarea className="field min-h-16" value={form.recipientAddress} onChange={e=>change("recipientAddress",e.target.value)} placeholder="Delivery address"/></Field></div></FormSection>
          </div>
          <FormSection title="Transport Details" icon={<Truck className="size-4"/>}><div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="PO Number"><input className="field" value={form.poNumber} onChange={e=>change("poNumber",e.target.value)} placeholder="Purchase order number"/></Field><Field label="PO Date"><input type="date" className="field" value={form.poDate} onChange={e=>change("poDate",e.target.value)}/></Field><Field label="Currency"><input className="field" value={form.currency} onChange={e=>change("currency",e.target.value)}/></Field><Field label="State of Supply"><input className="field" value={form.stateOfSupply} onChange={e=>change("stateOfSupply",e.target.value)} placeholder="State of supply"/></Field><Field label="Vehicle Number"><input className="field" value={form.vehicleNumber} onChange={e=>change("vehicleNumber",e.target.value)} placeholder="e.g. TN58 AB 4321"/></Field><Field label="Transporter Name"><input className="field" value={form.transporterName} onChange={e=>change("transporterName",e.target.value)} placeholder="Transporter name"/></Field></div></FormSection>
          <FormSection title="Product Details" icon={<FileText className="size-4"/>} action={<button type="button" onClick={()=>setForm(old=>({...old,items:[...old.items,blankItem()]}))} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Plus className="size-4"/> Add Product</button>}><div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50"><tr>{["Product (ID / Name) *","HSN","Qty","Unit","Action"].map(label=><th key={label} className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</th>)}</tr></thead><tbody>{form.items.map((it,i)=><tr key={i} className="border-t border-slate-100"><td className="w-[48%] px-3 py-2"><ProductAutocomplete className="field" placeholder="Search Product ID, name or SKU" value={it.description} onChange={value=>updateItem(i,"description",value)} onSelect={(product:WorkspaceProduct)=>{updateItem(i,"description",product.name);updateItem(i,"hsn",product.hsnCode||"");updateItem(i,"uom",product.unit||"Pcs")}}/></td><td className="w-[15%] px-3 py-2"><input className="field" placeholder="HSN" value={it.hsn} onChange={e=>updateItem(i,"hsn",e.target.value)}/></td><td className="w-[12%] px-3 py-2"><input className="field" type="number" min="0.001" step="0.001" value={it.quantity} onChange={e=>updateItem(i,"quantity",e.target.value)}/></td><td className="w-[15%] px-3 py-2"><input className="field" value={it.uom} onChange={e=>updateItem(i,"uom",e.target.value)}/></td><td className="px-3 py-2"><button type="button" disabled={form.items.length===1} onClick={()=>setForm(old=>({...old,items:old.items.filter((_,n)=>n!==i)}))} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30" title="Remove product"><Trash2 className="size-4"/></button></td></tr>)}</tbody></table></div><p className="text-xs text-slate-500">Product selection fills the description, HSN and unit. Delivery challans record quantities and dispatch details.</p></FormSection>
          <FormSection title="Additional Information" icon={<FileText className="size-4"/>}><div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2"><Field label="Reason for Transportation"><textarea className="field min-h-20" value={form.reason} onChange={e=>change("reason",e.target.value)} placeholder="Reason for transportation"/></Field><Field label="Notes / Terms & Conditions"><textarea className="field min-h-20" value={form.remarks} onChange={e=>change("remarks",e.target.value)} placeholder="Enter notes or terms and conditions"/></Field></div></FormSection>
          {error&&<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><button onClick={()=>setModal(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button><button disabled={saving} onClick={()=>void save(false)} className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50">{saving?"Saving…":editingId?"Update Draft":"Save Draft"}</button><button disabled={saving} onClick={()=>void save(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">{saving?"Saving…":"Save & Issue"}</button></div>
      </div>
    </div>}
    {modal==="view"&&selected&&<div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-3"><div className="mx-auto my-4 max-w-5xl rounded-xl bg-white p-3"><div className="mb-3 flex justify-end gap-2 print:hidden"><button onClick={()=>window.print()} className="btn-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white"><Printer className="size-4"/> Print / Save PDF</button><button onClick={()=>setModal(null)} className="rounded-lg border px-3 py-2"><X className="size-4"/></button></div><div id="delivery-challan-print"><PrintDocument challan={selected} company={companies.find(c => c.id === selected.companyId)}/></div></div></div>}
    <style jsx global>{` .field{width:100%;border:1px solid hsl(var(--input));background:hsl(var(--background));border-radius:9px;padding:9px 11px;font-size:13px;outline:none;min-height:39px;color: hsl(var(--foreground))}.field:focus{box-shadow:0 0 0 2px hsl(var(--ring)/.2)}.dc-print{max-width:210mm;min-height:277mm;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}.dc-items{table-layout:fixed}.dc-items th,.dc-items td{border:1px solid #111}.dc-items tbody td{height:38px}@page{size:A4;margin:0}@media print{html,body{background:#fff!important;margin:0!important;padding:0!important}body *{visibility:hidden!important}#delivery-challan-print,#delivery-challan-print *{visibility:visible!important}#delivery-challan-print{position:absolute!important;left:0!important;top:0!important;width:210mm!important;margin:0!important;padding:0!important}.dc-print{width:210mm!important;max-width:none!important;min-height:297mm!important;padding:12mm 10mm!important;margin:0!important;box-shadow:none!important}.print\\:hidden{display:none!important}.dc-items tr{break-inside:avoid}button{display:none!important}}`}</style>
  </div>;
}
function Stat({label,value,icon}:{label:string;value:number;icon:string}){const Icon=icon==="issued"?Truck:icon==="draft"?FileText:FileText;return <div className="border-border/60 bg-card group rounded-2xl border p-5 transition-all duration-200 hover:shadow-md"><div className="flex items-center justify-between"><div><p className="text-muted-foreground text-sm font-medium">{label}</p><p className="text-foreground mt-1.5 text-2xl font-bold tracking-tight">{value}</p></div><div className="bg-blue-50 text-blue-600 flex size-11 items-center justify-center rounded-xl"><Icon className="size-5"/></div></div></div>}
function Field({label,children,wide=false}:{label:string;children:ReactNode;wide?:boolean}){return <label className={`block space-y-1.5 ${wide?"col-span-full":""}`}><span className="text-muted-foreground block text-xs font-medium">{label}</span>{children}</label>}
function FormSection({title,icon,action,children}:{title:string;icon?:ReactNode;action?:ReactNode;children:ReactNode}){return <section className="border-border/60 overflow-visible rounded-xl border bg-card"><div className="border-border/60 flex min-h-11 items-center justify-between gap-3 rounded-t-xl border-b bg-primary/[0.06] px-4 py-2"><h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">{icon&&<span className="text-primary">{icon}</span>}{title}</h3>{action}</div><div className="space-y-4 p-4">{children}</div></section>}
