"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import type { Purchase } from "@/lib/data";
import type { PurchaseFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { PurchaseForm } from "@/components/purchase/purchase-form";
import { WorkspaceOwner } from "@/components/superadmin/workspace-owner";
import { useSession } from "@/components/auth/session-provider";
import { canPerform } from "@/lib/permissions";
import {
  ShoppingCart,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronRight as BreadcrumbSep,
  Filter,
  RotateCcw,
  MoreHorizontal,
  RefreshCw,
  ChevronDown,
  Download,
  Printer,
} from "lucide-react";
import * as XLSX from "xlsx";

type DialogMode =
  | null
  | { type: "add" }
  | { type: "edit"; purchase: Purchase }
  | { type: "delete"; purchase: Purchase };

export function PurchasesClient() {
  const pathname = usePathname();
  const portalBase = pathname.startsWith("/superadmin") ? "/superadmin" : "/dashboard";
  const { user } = useSession();
  const [data, setData] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const sortField = sorting.length > 0 ? sorting[0].id : "createdAt";
      const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: globalFilter,
        sortBy: sortField,
        sortOrder,
      });
      const res = await fetch(`/api/purchases?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load purchases");
      setData(json.data);
      setTotal(json.total);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load purchases");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sorting, globalFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [globalFilter, pageSize]);

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [openMenuId]);

  const handleAdd = async (formData: PurchaseFormData) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setDialog(null);
        fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (formData: PurchaseFormData) => {
    if (dialog?.type !== "edit") return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/purchases/${dialog.purchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setDialog(null);
        fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (dialog?.type !== "delete") return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/purchases/${dialog.purchase.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDialog(null);
        fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (purchase?: Purchase) => {
    const rows = purchase ? [purchase] : data;
    if (rows.length === 0) return;

    const headers = ["S No", "Gst No", "Vendor Name", "Invoice No", "Invoice Date", "State", "Rate", "Taxable Value", "IGST", "CGST", "SGST", "Total Invoice Value"];

    const dataRows = rows.map((p, i) => [
      i + 1,
      p.gstNo || "",
      p.partyName,
      p.invoiceNo,
      new Date(p.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }),
      p.state || "",
      `${p.rate}%`,
      Number(p.taxableValue),
      Number(p.igst),
      Number(p.cgst),
      Number(p.sgst),
      Number(p.totalAmount),
    ]);

    const totalRow = [
      "", "", "", "", "", "", "TOTAL",
      rows.reduce((s, p) => s + Number(p.taxableValue), 0),
      rows.reduce((s, p) => s + Number(p.igst), 0),
      rows.reduce((s, p) => s + Number(p.cgst), 0),
      rows.reduce((s, p) => s + Number(p.sgst), 0),
      rows.reduce((s, p) => s + Number(p.totalAmount), 0),
    ];

    const allRows = [headers, ...dataRows, totalRow];

    const ws = XLSX.utils.aoa_to_sheet(allRows);

    ws["!cols"] = [
      { wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 22 }, { wch: 14 },
      { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase");
    XLSX.writeFile(wb, `purchase-report${purchase ? `-${purchase.invoiceNo || purchase.id}` : ""}.xlsx`);
  };



  const handlePrint = (purchase: Purchase) => {
    const company = purchase.company;
    const safe = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch));
    const money = (value: unknown) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const width = Math.max(60, Math.min(320, Number(company?.signatureWidth || 160)));
    const height = Math.max(25, Math.min(140, Number(company?.signatureHeight || 60)));
    const html = `<!doctype html><html><head><title>Purchased Invoices ${safe(purchase.invoiceNo)}</title><style>
      *{box-sizing:border-box}body{font:13px Arial,sans-serif;color:#222;margin:0;padding:28px}.top{display:flex;gap:18px;align-items:center;border-bottom:2px solid #333;padding-bottom:16px}.logo{max-width:125px;max-height:85px;object-fit:contain}.brand{flex:1}.brand h1{font-size:20px;margin:0 0 7px}.muted{color:#555;line-height:1.55}.title{text-align:center;margin:24px 0;font-size:20px;letter-spacing:1px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;border:1px solid #bbb;padding:14px}.label{color:#666;font-size:11px;text-transform:uppercase;margin-bottom:4px}.value{font-weight:600}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #888;padding:10px;text-align:left}th{background:#f2f2f2}.num{text-align:right}.total{margin:16px 0 0 auto;width:300px}.total div{display:flex;justify-content:space-between;padding:5px 0}.grand{font-size:16px;font-weight:bold;border-top:2px solid #333;margin-top:6px;padding-top:9px!important}.sign{margin-top:65px;text-align:right;page-break-inside:avoid}.sign img{display:block;margin-left:auto;object-fit:contain;object-position:right bottom}.footer{margin-top:35px;border-top:1px solid #ccc;padding-top:8px;color:#777;font-size:10px}@media print{body{padding:12mm}}</style></head><body>
      ${company ? `<header class="top">${company.logoUrl ? `<img class="logo" src="${safe(company.logoUrl)}" alt="Company logo">` : ""}<div class="brand"><h1>${safe(company.name)}</h1><div class="muted">${company.address ? `${safe(company.address)}<br>` : ""}${company.gstNo ? `GSTIN: ${safe(company.gstNo)}<br>` : ""}${company.panNo ? `PAN: ${safe(company.panNo)}<br>` : ""}${company.phone ? `Phone: ${safe(company.phone)} ` : ""}${company.email ? `Email: ${safe(company.email)}` : ""}</div></div></header>` : ""}
      <h2 class="title">Purchased Invoices</h2><section class="grid"><div><div class="label">Vendor Name</div><div class="value">${safe(purchase.partyName)}</div><div class="muted">${purchase.gstNo ? `GSTIN: ${safe(purchase.gstNo)}` : ""}<br>${safe(purchase.state || "")}</div></div><div><div class="label">Invoice Details</div><div class="value">Invoice No: ${safe(purchase.invoiceNo)}</div><div class="muted">Date: ${safe(new Date(purchase.invoiceDate).toLocaleDateString("en-IN"))}</div></div></section>
      <table><thead><tr><th>Product / Description</th><th>HSN</th><th class="num">Qty</th><th>Unit</th><th class="num">Rate</th><th class="num">GST %</th><th class="num">Taxable Value (₹)</th><th class="num">IGST (₹)</th><th class="num">CGST (₹)</th><th class="num">SGST (₹)</th><th class="num">Total (₹)</th></tr></thead><tbody>${(purchase.items?.length ? purchase.items : [{description:"Purchase of goods / services",hsn:"",quantity:1,unit:"—",unitPrice:purchase.taxableValue,gstRate:purchase.rate,taxableValue:purchase.taxableValue,igst:purchase.igst,cgst:purchase.cgst,sgst:purchase.sgst,totalAmount:purchase.totalAmount}]).map(item=>`<tr><td>${safe(item.description)}</td><td>${safe(item.hsn||"")}</td><td class="num">${safe(item.quantity)}</td><td>${safe(item.unit)}</td><td class="num">${money(item.unitPrice)}</td><td class="num">${money(item.gstRate)}%</td><td class="num">${money(item.taxableValue)}</td><td class="num">${money(item.igst)}</td><td class="num">${money(item.cgst)}</td><td class="num">${money(item.sgst)}</td><td class="num">${money(item.totalAmount)}</td></tr>`).join("")}</tbody></table>
      <div class="total"><div><span>Taxable Value</span><b>₹ ${money(purchase.taxableValue)}</b></div><div><span>IGST</span><b>₹ ${money(purchase.igst)}</b></div><div><span>CGST</span><b>₹ ${money(purchase.cgst)}</b></div><div><span>SGST</span><b>₹ ${money(purchase.sgst)}</b></div><div class="grand"><span>Total Invoice Value</span><span>₹ ${money(purchase.totalAmount)}</span></div></div>
      <div class="sign">${company?.signatureUrl ? `<img src="${safe(company.signatureUrl)}" style="width:${width}px;height:${height}px" alt="Authorised signatory signature">` : ""}<b>Authorised Signatory</b></div><div class="footer">This document is generated from the Purchased Invoices records.</div>
      </body></html>`;
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);
    const printDocument = frame.contentDocument;
    if (!printDocument) {
      frame.remove();
      window.alert("Unable to prepare the Purchased Invoice print preview.");
      return;
    }
    printDocument.open();
    printDocument.write(html);
    printDocument.close();
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 1000);
    };
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns: ColumnDef<Purchase>[] = [
    {
      accessorKey: "gstNo",
      header: "GST No",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? (
          <span className="bg-muted/50 text-foreground rounded-md px-2 py-0.5 font-mono text-xs">
            {val}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      },
      size: 160,
    },
    {
      accessorKey: "partyName",
      header: "Vendor Name",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="from-primary/10 to-primary/5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
            <ShoppingCart className="text-primary size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate font-semibold">{info.row.original.partyName}</p>
            <WorkspaceOwner workspace={info.row.original.workspace} />
          </div>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
      cell: (info) => (
        <span className="text-foreground text-sm">{info.getValue() as string}</span>
      ),
      size: 140,
    },
    {
      accessorKey: "invoiceDate",
      header: "Invoice Date",
      cell: (info) => {
        const val = info.getValue() as string;
        if (!val) return <span className="text-muted-foreground/40">—</span>;
        const d = new Date(val);
        return (
          <span className="text-muted-foreground text-sm">
            {d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
      size: 120,
    },
    {
      accessorKey: "state",
      header: "State",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? (
          <span className="text-foreground text-sm">{val}</span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        );
      },
      size: 120,
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: (info) => (
        <span className="text-foreground text-sm">{Number(info.getValue())}%</span>
      ),
      size: 80,
    },
    {
      accessorKey: "taxableValue",
      header: "Taxable Value",
      cell: (info) => (
        <span className="text-foreground text-sm font-medium">
          ₹{Number(info.getValue()).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
      size: 130,
    },
    {
      accessorKey: "igst",
      header: "IGST",
      cell: (info) => (
        <span className="text-foreground text-sm">
          ₹{Number(info.getValue()).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: "cgst",
      header: "CGST",
      cell: (info) => (
        <span className="text-foreground text-sm">
          ₹{Number(info.getValue()).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: "sgst",
      header: "SGST",
      cell: (info) => (
        <span className="text-foreground text-sm">
          ₹{Number(info.getValue()).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: (info) => (
        <span className="text-foreground text-sm font-semibold">
          ₹{Number(info.getValue()).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
      size: 140,
    },
    {
      id: "actions",
      header: "Option",
      cell: (info) => {
        if (user.role !== "ADMIN" && !canPerform(user.actionPermissions, "purchases", "update") && !canPerform(user.actionPermissions, "purchases", "delete")) return null;
        const purchase = info.row.original;
        return (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (openMenuId === purchase.id) {
                  setOpenMenuId(null);
                } else {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                  setOpenMenuId(purchase.id);
                }
              }}
              className="text-muted-foreground hover:bg-muted/80 hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        );
      },
      enableSorting: false,
      size: 60,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination: { pageIndex: page - 1, pageSize } },
    pageCount: totalPages,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex: page - 1, pageSize });
        setPage(newState.pageIndex + 1);
        setPageSize(newState.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <a href={portalBase} className="hover:text-foreground transition-colors">
          Home
        </a>
        <BreadcrumbSep className="size-3.5" />
        <span className="text-foreground font-medium">Purchased Invoices</span>
      </nav>
      {loadError && <p className="text-destructive rounded-lg border p-3 text-sm" role="alert">{loadError}</p>}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
            <ShoppingCart className="text-primary size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight">Purchased Invoices</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage supplier invoices, GST values and printable purchase records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
              showFilters
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Filter className="size-4" />
            Filters
          </button>
          {(user.role === "ADMIN" || canPerform(user.actionPermissions, "purchases", "export")) && (
            <button
              onClick={() => handleDownload()}
              disabled={data.length === 0}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all disabled:opacity-40"
            >
              <Download className="size-4" />
              Download Excel
            </button>
          )}
          {(user.role === "ADMIN" || canPerform(user.actionPermissions, "purchases", "create")) && <button
            onClick={() => setDialog({ type: "add" })}
            className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="size-4" />
            New Purchased Invoices
          </button>}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-border/60 bg-card animate-fade-in rounded-2xl border p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="text-muted-foreground text-sm font-medium">Search across all fields</span>
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="border-border/60 bg-card rounded-2xl border shadow-sm">
        {/* Table Toolbar */}
        <div className="border-border/60 flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Show</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border-border/60 bg-card focus:ring-primary/20 h-9 appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm font-medium focus:ring-2 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2" />
            </div>
            <span className="text-muted-foreground text-sm">entries</span>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground/50 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search purchases..."
              className="border-border/60 bg-card focus:ring-primary/20 input-premium h-9 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-all focus:ring-2 focus:outline-none sm:w-64"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-border/60 bg-muted/30 border-b">
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
              {loading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="border-border/40 border-b last:border-0">
                    {columns.map((col, ci) => (
                      <td key={ci} className="px-5 py-3.5">
                        <div className="bg-muted h-4 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/50 flex size-14 items-center justify-center rounded-2xl">
                        <ShoppingCart className="text-muted-foreground/40 size-7" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">No purchases found</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {globalFilter
                            ? "Try adjusting your search"
                            : "Get started by adding your first purchase"}
                        </p>
                      </div>
                      {user.role === "ADMIN" && !globalFilter && (
                        <button
                          onClick={() => setDialog({ type: "add" })}
                          className="btn-gradient text-primary-foreground mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all"
                        >
                          <Plus className="size-4" />
                          New Purchased Invoices
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-border/40 border-b transition-colors last:border-0",
                      index % 2 === 0 ? "hover:bg-muted/30 bg-transparent" : "bg-muted/10 hover:bg-muted/30"
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

        {/* Pagination */}
        <div className="border-border/60 flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Showing{" "}
            <span className="text-foreground font-medium">
              {total === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="text-foreground font-medium">{Math.min(page * pageSize, total)}</span>{" "}
            of <span className="text-foreground font-medium">{total}</span> entries
            {globalFilter && (
              <span className="text-muted-foreground"> (filtered)</span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-3.5" />
              <ChevronLeft className="-ml-2 size-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                    page === pageNum
                      ? "bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="size-3.5" />
              <ChevronRight className="-ml-2 size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Menu */}
      {openMenuId !== null && (() => {
        const purchase = data.find((p) => p.id === openMenuId);
        if (!purchase) return null;
        return (
          <div
            className="border-border/60 bg-popover animate-fade-in fixed z-50 w-48 rounded-xl border p-1.5 shadow-xl"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button onClick={(e) => { e.stopPropagation(); handlePrint(purchase); setOpenMenuId(null); }} className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"><Printer className="text-muted-foreground size-4" />Print / PDF</button>
            {(user.role === "ADMIN" || canPerform(user.actionPermissions, "purchases", "update")) && <button
              onClick={(e) => {
                e.stopPropagation();
                setDialog({ type: "edit", purchase });
                setOpenMenuId(null);
              }}
              className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <Pencil className="text-muted-foreground size-4" />
              Edit Purchase
            </button>}
            {(user.role === "ADMIN" || canPerform(user.actionPermissions, "purchases", "export")) && <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(purchase);
                setOpenMenuId(null);
              }}
              className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <Download className="text-muted-foreground size-4" />
              Download Excel
            </button>}
            {(user.role === "ADMIN" || canPerform(user.actionPermissions, "purchases", "delete")) && <><div className="bg-border/40 my-1 h-px" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDialog({ type: "delete", purchase });
                setOpenMenuId(null);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 className="size-4" />
              Delete
            </button></>}
          </div>
        );
      })()}

      {/* Dialog Overlay */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !actionLoading && setDialog(null)}
          />
          <div className="border-border/60 bg-card relative mx-4 w-full max-w-2xl rounded-2xl border p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    dialog.type === "add" && "bg-primary/10",
                    dialog.type === "edit" && "bg-blue-500/10",
                    dialog.type === "delete" && "bg-red-500/10"
                  )}
                >
                  {dialog.type === "add" && <Plus className="text-primary size-4.5" />}
                  {dialog.type === "edit" && <Pencil className="size-4.5 text-blue-600" />}
                  {dialog.type === "delete" && <Trash2 className="size-4.5 text-red-600" />}
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  {dialog.type === "add" && "Add Purchased Invoices"}
                  {dialog.type === "edit" && "Edit Purchase"}
                  {dialog.type === "delete" && "Delete Purchase"}
                </h2>
              </div>
              {!actionLoading && (
                <button
                  onClick={() => setDialog(null)}
                  className="text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {dialog.type === "add" && (
              <PurchaseForm
                onSubmit={handleAdd}
                onCancel={() => setDialog(null)}
                isLoading={actionLoading}
              />
            )}
            {dialog.type === "edit" && (
              <PurchaseForm
                purchase={dialog.purchase}
                onSubmit={handleEdit}
                onCancel={() => setDialog(null)}
                isLoading={actionLoading}
              />
            )}
            {dialog.type === "delete" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-muted-foreground text-sm">
                    Are you sure you want to delete the purchase from{" "}
                    <span className="text-foreground font-semibold">{dialog.purchase.partyName}</span>{" "}
                    (Invoice: {dialog.purchase.invoiceNo})? This action cannot be undone.
                  </p>
                </div>
                <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
                  <button
                    onClick={() => setDialog(null)}
                    disabled={actionLoading}
                    className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Delete Purchase
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
