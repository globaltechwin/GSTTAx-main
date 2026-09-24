"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { referrals as initialReferrals, type Referral } from "@/lib/data";
import type { ReferralFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { ReferralForm } from "@/components/referral/referral-form";
import { ReferralView } from "@/components/referral/referral-view";
import {
  Users,
  Plus,
  Pencil,
  Eye,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronRight as BreadcrumbSep,
} from "lucide-react";

type DialogMode =
  | null
  | { type: "add" }
  | { type: "edit"; referral: Referral }
  | { type: "view"; referral: Referral }
  | { type: "delete"; referral: Referral };

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ReferralClient() {
  const [data, setData] = useState<Referral[]>(initialReferrals);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const handleAdd = (formData: ReferralFormData) => {
    const newReferral: Referral = {
      id: Math.max(0, ...data.map((r) => r.id)) + 1,
      name: formData.name,
      email: formData.email ?? "",
      mobile: formData.mobile ?? "",
      date: formData.date,
    };
    setData((prev) => [...prev, newReferral]);
    setDialog(null);
  };

  const handleEdit = (formData: ReferralFormData) => {
    if (dialog?.type !== "edit") return;
    setData((prev) =>
      prev.map((r) =>
        r.id === dialog.referral.id
          ? {
              ...r,
              name: formData.name,
              email: formData.email ?? "",
              mobile: formData.mobile ?? "",
              date: formData.date,
            }
          : r
      )
    );
    setDialog(null);
  };

  const handleDelete = () => {
    if (dialog?.type !== "delete") return;
    setData((prev) => prev.filter((r) => r.id !== dialog.referral.id));
    setDialog(null);
  };

  const columns: ColumnDef<Referral>[] = [
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
      header: "Sr.No",
      cell: (info) => (
        <span className="text-muted-foreground font-medium">{info.row.index + 1}</span>
      ),
      size: 60,
    },
    {
      accessorKey: "name",
      header: "Referral Name",
      cell: (info) => (
        <span className="text-foreground font-semibold">{info.row.original.name}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Referral Email",
      cell: (info) => {
        const val = info.getValue() as string;
        return val ? (
          <span className="text-sm">{val}</span>
        ) : (
          <span className="text-muted-foreground/40">-</span>
        );
      },
    },
    {
      accessorKey: "mobile",
      header: "Referral Mobile",
      cell: (info) => {
        const val = info.getValue() as string;
        return val ? (
          <span className="bg-muted/50 text-foreground rounded-md px-2 py-0.5 font-mono text-xs">
            {val}
          </span>
        ) : (
          <span className="text-muted-foreground/40">-</span>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (info) => {
        const val = info.getValue() as string;
        if (!val) return <span className="text-muted-foreground/40">-</span>;
        return <span className="text-muted-foreground text-sm">{formatDate(val)}</span>;
      },
    },
    {
      id: "actions",
      header: "Option",
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDialog({ type: "edit", referral: info.row.original })}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/20"
            title="Edit referral"
          >
            <Pencil className="size-3" />
            Edit
          </button>
          <button
            onClick={() => setDialog({ type: "view", referral: info.row.original })}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20"
            title="View referral"
          >
            <Eye className="size-3" />
            View
          </button>
          <button
            onClick={() => setDialog({ type: "delete", referral: info.row.original })}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20"
            title="Delete referral"
          >
            <Trash2 className="size-3" />
            Delete
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination: { pageIndex: 0, pageSize }, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex: 0, pageSize });
        setPageSize(newState.pageSize);
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <a href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </a>
        <BreadcrumbSep className="size-3.5" />
        <span className="text-foreground font-medium">Referrals</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
            <Users className="text-primary size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                Referral Management
              </h1>
              <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {data.length} total
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage your referrals and their details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialog({ type: "add" })}
            className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="size-4" />
            Add Referral
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="border-border/60 bg-card rounded-2xl border shadow-sm">
        {/* Table Toolbar */}
        <div className="border-border/60 flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border-border/60 bg-card focus:ring-primary/20 h-9 rounded-lg border px-3 text-sm font-medium focus:ring-2 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
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
              placeholder="Search referrals..."
              className="border-border/60 bg-card focus:ring-primary/20 h-9 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-all focus:ring-2 focus:outline-none sm:w-64"
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
                <tr key={headerGroup.id} className="border-border/60 bg-muted/40 border-b">
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/50 flex size-14 items-center justify-center rounded-2xl">
                        <Users className="text-muted-foreground/40 size-7" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">No referrals found</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {globalFilter
                            ? "Try adjusting your search terms"
                            : "Get started by adding your first referral"}
                        </p>
                      </div>
                      {!globalFilter && (
                        <button
                          onClick={() => setDialog({ type: "add" })}
                          className="btn-gradient text-primary-foreground mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all"
                        >
                          <Plus className="size-4" />
                          Add Referral
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
              {table.getFilteredRowModel().rows.length === 0
                ? 0
                : table.getState().pagination.pageIndex * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="text-foreground font-medium">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{" "}
            of{" "}
            <span className="text-foreground font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            entries
            {globalFilter && (
              <span className="text-muted-foreground"> (filtered from {data.length} total)</span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            {table.getPageOptions().map((page) => (
              <button
                key={page}
                onClick={() => table.setPageIndex(page)}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                  table.getState().pagination.pageIndex === page
                    ? "bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {page + 1}
              </button>
            ))}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDialog(null)}
          />
          <div className="border-border/60 bg-card relative mx-4 w-full max-w-lg rounded-2xl border p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    dialog.type === "add" && "bg-primary/10",
                    dialog.type === "edit" && "bg-blue-500/10",
                    dialog.type === "view" && "bg-amber-500/10",
                    dialog.type === "delete" && "bg-red-500/10"
                  )}
                >
                  {dialog.type === "add" && <Plus className="text-primary size-4.5" />}
                  {dialog.type === "edit" && <Pencil className="size-4.5 text-blue-600" />}
                  {dialog.type === "view" && <Eye className="size-4.5 text-amber-600" />}
                  {dialog.type === "delete" && <Trash2 className="size-4.5 text-red-600" />}
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  {dialog.type === "add" && "Add New Referral"}
                  {dialog.type === "edit" && "Edit Referral"}
                  {dialog.type === "view" && "Referral Details"}
                  {dialog.type === "delete" && "Delete Referral"}
                </h2>
              </div>
              <button
                onClick={() => setDialog(null)}
                className="text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {dialog.type === "add" && (
              <ReferralForm onSubmit={handleAdd} onCancel={() => setDialog(null)} />
            )}
            {dialog.type === "edit" && (
              <ReferralForm
                referral={dialog.referral}
                onSubmit={handleEdit}
                onCancel={() => setDialog(null)}
              />
            )}
            {dialog.type === "view" && (
              <ReferralView referral={dialog.referral} onClose={() => setDialog(null)} />
            )}
            {dialog.type === "delete" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-muted-foreground text-sm">
                    Are you sure you want to delete{" "}
                    <span className="text-foreground font-semibold">{dialog.referral.name}</span>?
                    This action cannot be undone and all associated data will be permanently
                    removed.
                  </p>
                </div>
                <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
                  <button
                    onClick={() => setDialog(null)}
                    className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
                  >
                    <Trash2 className="size-4" />
                    Delete Referral
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
