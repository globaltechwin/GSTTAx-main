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
import { companies, type Company } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpDown, Plus, Search, Building2 } from "lucide-react";

const columns: ColumnDef<Company>[] = [
  {
    id: "srNo",
    header: "Sr.No",
    cell: (info) => (
      <span className="text-muted-foreground font-mono text-xs">{info.row.index + 1}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "Company Name",
    cell: (info) => (
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="size-3.5" />
        </div>
        <span className="text-foreground font-medium">{info.row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "gstNo",
    header: "GST No",
    cell: (info) => {
      const val = info.getValue() as string;
      return val ? (
        <span className="bg-muted/50 rounded-md px-2 py-0.5 font-mono text-xs">{val}</span>
      ) : (
        <span className="text-muted-foreground/40">—</span>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info) => {
      const val = info.getValue() as string;
      return val ? (
        <span className="text-sm">{val}</span>
      ) : (
        <span className="text-muted-foreground/40">—</span>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: (info) => {
      const val = info.getValue() as string;
      return val ? (
        <span className="font-mono text-sm">{val}</span>
      ) : (
        <span className="text-muted-foreground/40">—</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => {
      const val = info.getValue() as string;
      const isActive = val === "active";
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            isActive
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
            )}
          />
          {isActive ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

export function CompaniesTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: companies,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="border-border/60 bg-card overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="border-border/60 flex flex-col items-start justify-between gap-3 border-b p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">Show</span>
          <select className="border-border/60 bg-card focus:ring-primary/20 h-8 rounded-lg border px-2 text-sm transition-all focus:ring-2 focus:outline-none">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-muted-foreground text-sm">entries</span>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="text-muted-foreground/60 absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="input-premium border-border/60 bg-muted/30 h-8 w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:outline-none sm:w-56"
            />
          </div>
          <Link
            href="/dashboard/companies"
            className="btn-gradient inline-flex h-8 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            Add Company
          </Link>
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
                    className="text-muted-foreground px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className="hover:text-foreground flex items-center gap-1 transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="size-3 opacity-40 transition-opacity hover:opacity-100" />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className="border-border/40 hover:bg-muted/20 border-b transition-all duration-200 last:border-0"
                style={{
                  animationDelay: `${800 + index * 50}ms`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-3.5 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-border/60 flex items-center justify-between border-t px-5 py-3.5">
        <p className="text-muted-foreground text-sm">
          Showing{" "}
          <span className="text-foreground font-medium">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="text-foreground font-medium">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </span>{" "}
          of{" "}
          <span className="text-foreground font-medium">
            {table.getFilteredRowModel().rows.length}
          </span>{" "}
          entries
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-30"
          >
            Previous
          </button>
          {table.getPageOptions().map((page) => (
            <button
              key={page}
              onClick={() => table.setPageIndex(page)}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-all",
                table.getState().pagination.pageIndex === page
                  ? "bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {page + 1}
            </button>
          ))}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
