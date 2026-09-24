"use client";

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
} from "lucide-react";
import * as XLSX from "xlsx";

type DialogMode =
  | null
  | { type: "add" }
  | { type: "edit"; purchase: Purchase }
  | { type: "delete"; purchase: Purchase };

export function PurchasesClient() {
  const [data, setData] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
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
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setTotal(json.total);
      }
    } catch {
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

    const headers = ["S No", "Gst No", "Party Name", "Invoice No", "Invoice Date", "State", "Rate", "Taxable Value", "IGST", "CGST", "SGST", "Total Invoice Value"];

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

  const totalPages = Math.ceil(total / pageSize);

  const columns: ColumnDef<Purchase>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="border-border/60 bg-card accent-primary size-4 cursor-pointer rounded"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="border-border/60 bg-card accent-primary size-4 cursor-pointer rounded"
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "srNo",
      header: "#",
      cell: (info) => (
        <span className="text-muted-foreground font-medium">
          {(page - 1) * pageSize + info.row.index + 1}
        </span>
      ),
      size: 50,
    },
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
      header: "Party Name",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="from-primary/10 to-primary/5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
            <ShoppingCart className="text-primary size-4" />
          </div>
          <p className="text-foreground truncate font-semibold">{info.row.original.partyName}</p>
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
    state: { sorting, pagination: { pageIndex: page - 1, pageSize }, rowSelection },
    pageCount: totalPages,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
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
        <a href="/dashboard" className="hover:text-foreground transition-colors">
          Home
        </a>
        <BreadcrumbSep className="size-3.5" />
        <span className="text-foreground font-medium">Purchase</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
            <ShoppingCart className="text-primary size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight">Purchase</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage your purchase entries and vendor details
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
          <button
            onClick={() => handleDownload()}
            disabled={data.length === 0}
            className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all disabled:opacity-40"
          >
            <Download className="size-4" />
            Download Excel
          </button>
          <button
            onClick={() => setDialog({ type: "add" })}
            className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="size-4" />
            New Purchase
          </button>
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
            {Object.keys(rowSelection).length > 0 && (
              <span className="bg-primary/10 text-primary animate-fade-in inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {Object.keys(rowSelection).length} selected
              </span>
            )}
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
                      {!globalFilter && (
                        <button
                          onClick={() => setDialog({ type: "add" })}
                          className="btn-gradient text-primary-foreground mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all"
                        >
                          <Plus className="size-4" />
                          New Purchase
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
                      row.getIsSelected()
                        ? "bg-primary/5"
                        : index % 2 === 0
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDialog({ type: "edit", purchase });
                setOpenMenuId(null);
              }}
              className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <Pencil className="text-muted-foreground size-4" />
              Edit Purchase
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(purchase);
                setOpenMenuId(null);
              }}
              className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <Download className="text-muted-foreground size-4" />
              Download Excel
            </button>
            <div className="bg-border/40 my-1 h-px" />
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
            </button>
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
                  {dialog.type === "add" && "Add New Purchase"}
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
