"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProductAutocomplete, type WorkspaceProduct } from "@/components/product/product-autocomplete";
import type { PurchaseFormData } from "@/lib/validations";
import { Plus, Trash2 } from "lucide-react";

interface CompanyOption { id: number; name: string; gstNo?: string | null; panNo?: string | null; phone?: string | null; email?: string | null; address?: string | null; state?: string | null; status?: string; }
interface VendorOption { id: number; name: string; gstin?: string | null; state?: string | null; mobile?: string | null; }
type PurchaseLine = { productId: number | null; description: string; hsn: string; quantity: string; unit: string; unitPrice: string; gstRate: string };
const blankLine = (): PurchaseLine => ({ productId: null, description: "", hsn: "", quantity: "1", unit: "Nos", unitPrice: "0", gstRate: "0" });
const money = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface PurchaseFormProps {
  purchase?: {
    id: number; companyId?: number | null; gstNo: string | null; partyName: string; invoiceNo: string; invoiceDate: string | Date; state: string | null;
    rate: number | string; taxableValue: number | string; igst: number | string; cgst: number | string; sgst: number | string; totalAmount: number | string;
    items?: Array<{ productId?: number | null; description: string; hsn?: string | null; quantity: number | string; unit: string; unitPrice: number | string; gstRate: number | string }>;
  };
  onSubmit: (data: PurchaseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PurchaseForm({ purchase, onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [companyId, setCompanyId] = useState(purchase?.companyId ? String(purchase.companyId) : "");
  const [partyName, setPartyName] = useState(purchase?.partyName || "");
  const [gstNo, setGstNo] = useState(purchase?.gstNo || "");
  const [invoiceNo, setInvoiceNo] = useState(purchase?.invoiceNo || "");
  const [invoiceDate, setInvoiceDate] = useState(purchase?.invoiceDate ? new Date(purchase.invoiceDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [state, setState] = useState(purchase?.state || "");
  const [interState, setInterState] = useState(Number(purchase?.igst || 0) > 0);
  const [items, setItems] = useState<PurchaseLine[]>(purchase?.items?.length ? purchase.items.map(item => ({ productId: item.productId ?? null, description: item.description, hsn: item.hsn || "", quantity: String(item.quantity), unit: item.unit || "Nos", unitPrice: String(item.unitPrice), gstRate: String(item.gstRate) })) : purchase ? [{ productId: null, description: "Purchase of goods / services", hsn: "", quantity: "1", unit: "Nos", unitPrice: String(purchase.taxableValue || 0), gstRate: String(purchase.rate || 0) }] : [blankLine()]);

  useEffect(() => {
    fetch("/api/companies?page=1&pageSize=200").then(r => r.ok ? r.json() : null).then(json => setCompanies((json?.data || []).filter((c: CompanyOption) => c.status === "active"))).catch(() => {});
    fetch("/api/vendors?status=all&page=1&pageSize=100").then(r => r.ok ? r.json() : null).then(json => setVendors(json?.data || [])).catch(() => {});
  }, []);
  const lineTotals = useMemo(() => items.map(item => {
    const taxableValue = Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0);
    const tax = taxableValue * Math.max(0, Number(item.gstRate) || 0) / 100;
    return { taxableValue, igst: interState ? tax : 0, cgst: interState ? 0 : tax / 2, sgst: interState ? 0 : tax / 2, totalAmount: taxableValue + tax };
  }), [items, interState]);
  const totals = useMemo(() => lineTotals.reduce((acc, line) => ({ taxableValue: acc.taxableValue + line.taxableValue, igst: acc.igst + line.igst, cgst: acc.cgst + line.cgst, sgst: acc.sgst + line.sgst, totalAmount: acc.totalAmount + line.totalAmount }), { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, totalAmount: 0 }), [lineTotals]);
  const updateLine = (index: number, patch: Partial<PurchaseLine>) => setItems(old => old.map((line, i) => i === index ? { ...line, ...patch } : line));
  const selectProduct = (index: number, product: WorkspaceProduct) => updateLine(index, { productId: product.id, description: product.name, hsn: product.hsnCode || "", unit: product.unit || "Nos", unitPrice: String(product.purchaseRate ?? 0), gstRate: String(product.gstRate ?? 0) });
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const taxableValue = Number(totals.taxableValue.toFixed(2));
    const igst = Number(totals.igst.toFixed(2)); const cgst = Number(totals.cgst.toFixed(2)); const sgst = Number(totals.sgst.toFixed(2));
    const weightedRate = taxableValue ? Number((items.reduce((sum, item, i) => sum + lineTotals[i].taxableValue * Number(item.gstRate || 0), 0) / taxableValue).toFixed(2)) : 0;
    onSubmit({ companyId: companyId ? Number(companyId) : null, gstNo, partyName, invoiceNo, invoiceDate, state, rate: weightedRate, taxableValue, igst, cgst, sgst, totalAmount: Number(totals.totalAmount.toFixed(2)), items: items.map((item, i) => ({ productId: item.productId, description: item.description.trim(), hsn: item.hsn, quantity: Number(item.quantity), unit: item.unit, unitPrice: Number(item.unitPrice), gstRate: Number(item.gstRate), taxableValue: Number(lineTotals[i].taxableValue.toFixed(2)), igst: Number(lineTotals[i].igst.toFixed(2)), cgst: Number(lineTotals[i].cgst.toFixed(2)), sgst: Number(lineTotals[i].sgst.toFixed(2)), totalAmount: Number(lineTotals[i].totalAmount.toFixed(2)) })) });
  };

  return <form onSubmit={submit} className="space-y-6">
    <section className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
      <div className="space-y-2"><Label>Company Name</Label><select value={companyId} onChange={e => { const id = e.target.value; setCompanyId(id); const company = companies.find(c => c.id === Number(id)); if (company) { setGstNo(company.gstNo || ""); setState(company.state || ""); } }} className="bg-background border-border h-10 w-full rounded-lg border px-3 text-sm"><option value="">Select company</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="space-y-2"><Label>Vendor Name *</Label><Input required maxLength={100} list="purchase-vendor-options" autoComplete="off" placeholder="Search or enter vendor name" value={partyName} onChange={e => { const value = e.target.value; setPartyName(value); const vendor = vendors.find(item => item.name.toLowerCase() === value.trim().toLowerCase()); if (vendor) { setGstNo(vendor.gstin || ""); setState(vendor.state || ""); } }} /><datalist id="purchase-vendor-options">{vendors.map(vendor => <option key={vendor.id} value={vendor.name}>{[vendor.gstin, vendor.state].filter(Boolean).join(" · ")}</option>)}</datalist><p className="text-muted-foreground text-xs">Select an existing vendor or enter a new vendor name.</p></div>
      <div className="space-y-2"><Label>Supplier Invoice Number *</Label><Input required maxLength={50} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} /></div>
      <div className="space-y-2"><Label>Invoice Date *</Label><Input required type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
      <div className="space-y-2"><Label>GSTIN</Label><Input value={gstNo} onChange={e => setGstNo(e.target.value)} /></div>
      <div className="space-y-2"><Label>State</Label><Input value={state} onChange={e => setState(e.target.value)} /></div>
    </section>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Purchased Products</h3><p className="text-muted-foreground text-xs">Select products by Product ID, name or SKU. Product details and purchase rates fill automatically.</p></div><button type="button" onClick={() => setItems(old => [...old, blankLine()])} className="text-primary inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium"><Plus className="size-4"/> Add product</button></div>
      <div className="flex items-center gap-2"><input id="purchase-interstate" type="checkbox" checked={interState} onChange={e => setInterState(e.target.checked)} className="size-4"/><Label htmlFor="purchase-interstate">Inter-state purchase (IGST)</Label></div>
      <div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border p-3 md:grid-cols-12 md:items-end">
        <div className="space-y-1 md:col-span-4"><Label>Product *</Label><ProductAutocomplete value={item.description} onChange={value => updateLine(index, { description: value, productId: null })} onSelect={product => selectProduct(index, product)} className="h-10 w-full rounded-lg border bg-background px-3 text-sm" /></div>
        <div className="space-y-1 md:col-span-2"><Label>HSN</Label><Input value={item.hsn} onChange={e => updateLine(index, { hsn: e.target.value })}/></div>
        <div className="space-y-1 md:col-span-1"><Label>Qty</Label><Input type="number" min="0.001" step="0.001" value={item.quantity} onChange={e => updateLine(index, { quantity: e.target.value })}/></div>
        <div className="space-y-1 md:col-span-1"><Label>Unit</Label><Input value={item.unit} onChange={e => updateLine(index, { unit: e.target.value })}/></div>
        <div className="space-y-1 md:col-span-1"><Label>Rate</Label><Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateLine(index, { unitPrice: e.target.value })}/></div>
        <div className="space-y-1 md:col-span-1"><Label>GST %</Label><Input type="number" min="0" max="100" step="0.01" value={item.gstRate} onChange={e => updateLine(index, { gstRate: e.target.value })}/></div>
        <div className="flex items-center justify-between gap-2 md:col-span-2"><div><Label>Line Total</Label><p className="pt-2 text-sm font-semibold">{money(lineTotals[index].totalAmount)}</p></div><button type="button" disabled={items.length === 1} onClick={() => setItems(old => old.filter((_, i) => i !== index))} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30" title="Remove product"><Trash2 className="size-4"/></button></div>
      </div>)}</div>
    </section>
    <section className="ml-auto grid max-w-xl gap-2 rounded-xl border p-4 text-sm sm:grid-cols-2"><div className="text-muted-foreground">Taxable value</div><div className="text-right font-medium">{money(totals.taxableValue)}</div><div className="text-muted-foreground">IGST</div><div className="text-right">{money(totals.igst)}</div><div className="text-muted-foreground">CGST</div><div className="text-right">{money(totals.cgst)}</div><div className="text-muted-foreground">SGST</div><div className="text-right">{money(totals.sgst)}</div><div className="border-t pt-2 font-semibold">Total Invoice Value</div><div className="border-t pt-2 text-right text-base font-bold">{money(totals.totalAmount)}</div></section>
    <div className="flex justify-end gap-3 border-t pt-5"><button type="button" onClick={onCancel} disabled={isLoading} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={isLoading || !partyName.trim() || !invoiceNo.trim() || items.some(item => !item.description.trim() || Number(item.quantity) <= 0)} className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isLoading ? "Saving..." : purchase ? "Update Purchase" : "Add Purchase"}</button></div>
  </form>;
}
