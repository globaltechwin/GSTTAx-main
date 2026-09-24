"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import type { AppUser } from "@/lib/data";
import type { UserFormData } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { UserForm } from "@/components/user/user-form";
import {
  UsersRound,
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
  RotateCcw,
  MoreHorizontal,
  RefreshCw,
  ChevronDown,
  Shield,
  ShieldOff,
  Key,
  Lock,
} from "lucide-react";

const SIDEBAR_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  companies: "Company",
  "to-companies": "To Company",
  invoices: "Invoice",
  purchases: "Purchase",
  "turnover-report": "Turnover Report",
  referrals: "Referral",
  "import-export": "Import/Export",
  users: "Users",
  settings: "Settings",
};

type DialogMode =
  | null
  | { type: "add" }
  | { type: "edit"; user: AppUser }
  | { type: "delete"; user: AppUser }
  | { type: "access"; user: AppUser };

export function UsersClient() {
  const [data, setData] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
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
      const res = await fetch(`/api/users?${params}`);
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

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [globalFilter, pageSize]);

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenuId]);

  const handleAdd = async (formData: UserFormData) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setDialog(null); fetchData(); }
    } finally { setActionLoading(false); }
  };

  const handleEdit = async (formData: UserFormData) => {
    if (dialog?.type !== "edit") return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${dialog.user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setDialog(null); fetchData(); }
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (dialog?.type !== "delete") return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${dialog.user.id}`, { method: "DELETE" });
      if (res.ok) { setDialog(null); fetchData(); }
    } finally { setActionLoading(false); }
  };

  const handleToggleStatus = async (user: AppUser) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status === "active" ? "inactive" : "active",
          sidebarAccess: user.sidebarAccess,
        }),
      });
      if (res.ok) { fetchData(); }
    } finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / pageSize);

  const columns: ColumnDef<AppUser>[] = [
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
      accessorKey: "firstName",
      header: "Name",
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="from-primary/10 to-primary/5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
              <span className="text-primary text-xs font-bold">
                {row.firstName.charAt(0)}{row.lastName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate font-semibold">{row.firstName} {row.lastName}</p>
              <p className="text-muted-foreground truncate text-xs">@{row.username}</p>
            </div>
          </div>
        );
      },
      size: 200,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? <span className="text-foreground text-sm">{val}</span> : <span className="text-muted-foreground/40">—</span>;
      },
      size: 180,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: (info) => {
        const val = info.getValue() as string | null;
        return val ? <span className="text-foreground text-sm">{val}</span> : <span className="text-muted-foreground/40">—</span>;
      },
      size: 120,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: (info) => {
        const val = (info.getValue() as string) || "user";
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
              val === "admin"
                ? "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400"
                : "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400"
            )}
          >
            {val === "admin" ? <Shield className="size-3" /> : null}
            {val.charAt(0).toUpperCase() + val.slice(1)}
          </span>
        );
      },
      size: 100,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const val = (info.getValue() as string) || "active";
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
              val === "active"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400"
            )}
          >
            {val === "active" ? "Active" : "Inactive"}
          </span>
        );
      },
      size: 90,
    },
    {
      id: "actions",
      header: "Option",
      cell: (info) => {
        const user = info.row.original;
        return (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (openMenuId === user.id) {
                  setOpenMenuId(null);
                } else {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                  setOpenMenuId(user.id);
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
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <a href="/dashboard" className="hover:text-foreground transition-colors">Home</a>
        <BreadcrumbSep className="size-3.5" />
        <span className="text-foreground font-medium">Users</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
            <UsersRound className="text-primary size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Manage user accounts and access permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialog({ type: "add" })}
            className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="size-4" />
            New User
          </button>
        </div>
      </div>

      <div className="border-border/60 bg-card rounded-2xl border shadow-sm">
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
              placeholder="Search users..."
              className="border-border/60 bg-card focus:ring-primary/20 input-premium h-9 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-all focus:ring-2 focus:outline-none sm:w-64"
            />
            {globalFilter && (
              <button onClick={() => setGlobalFilter("")} className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-border/60 bg-muted/30 border-b">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-muted-foreground px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase">
                      {header.isPlaceholder ? null : (
                        <button
                          className={cn("flex items-center gap-1.5 transition-colors", header.column.getCanSort() && "hover:text-foreground cursor-pointer")}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="flex flex-col">
                              {header.column.getIsSorted() === "asc" ? <ArrowUp className="text-primary size-3" /> : header.column.getIsSorted() === "desc" ? <ArrowDown className="text-primary size-3" /> : <ArrowUpDown className="size-3 opacity-30" />}
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
                      <td key={ci} className="px-5 py-3.5"><div className="bg-muted h-4 animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/50 flex size-14 items-center justify-center rounded-2xl">
                        <UsersRound className="text-muted-foreground/40 size-7" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">No users found</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {globalFilter ? "Try adjusting your search" : "Get started by adding your first user"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-border/40 border-b transition-colors last:border-0",
                      row.getIsSelected() ? "bg-primary/5" : index % 2 === 0 ? "hover:bg-muted/30 bg-transparent" : "bg-muted/10 hover:bg-muted/30"
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

        <div className="border-border/60 flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Showing <span className="text-foreground font-medium">{total === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{" "}
            <span className="text-foreground font-medium">{Math.min(page * pageSize, total)}</span> of{" "}
            <span className="text-foreground font-medium">{total}</span> entries
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(1)} disabled={page <= 1} className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronLeft className="size-3.5" /><ChevronLeft className="-ml-2 size-3.5" />
            </button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronLeft className="size-4" />Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} className={cn("inline-flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition-all", page === pageNum ? "bg-primary text-primary-foreground shadow-primary/20 shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30">
              Next<ChevronRight className="size-4" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-30">
              <ChevronRight className="size-3.5" /><ChevronRight className="-ml-2 size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Menu */}
      {openMenuId !== null && (() => {
        const user = data.find((u) => u.id === openMenuId);
        if (!user) return null;
        return (
          <div className="border-border/60 bg-popover animate-fade-in fixed z-50 w-52 rounded-xl border p-1.5 shadow-xl" style={{ top: menuPos.top, right: menuPos.right }}>
            <button onClick={(e) => { e.stopPropagation(); setDialog({ type: "edit", user }); setOpenMenuId(null); }} className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <Pencil className="text-muted-foreground size-4" />Edit User
            </button>
            <button onClick={(e) => { e.stopPropagation(); setDialog({ type: "access", user }); setOpenMenuId(null); }} className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <Key className="text-muted-foreground size-4" />User Access
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); setOpenMenuId(null); }} disabled={actionLoading} className="text-foreground hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50">
              {user.status === "active" ? <ShieldOff className="text-muted-foreground size-4" /> : <Shield className="text-muted-foreground size-4" />}
              {user.status === "active" ? "Deactivate" : "Activate"}
            </button>
            <div className="bg-border/40 my-1 h-px" />
            <button onClick={(e) => { e.stopPropagation(); setDialog({ type: "delete", user }); setOpenMenuId(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
              <Trash2 className="size-4" />Delete
            </button>
          </div>
        );
      })()}

      {/* Dialog Overlay */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !actionLoading && setDialog(null)} />
          <div className="border-border/60 bg-card relative mx-4 w-full max-w-2xl rounded-2xl border p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("flex size-9 items-center justify-center rounded-xl", dialog.type === "add" && "bg-primary/10", dialog.type === "edit" && "bg-blue-500/10", dialog.type === "delete" && "bg-red-500/10", dialog.type === "access" && "bg-amber-500/10")}>
                  {dialog.type === "add" && <Plus className="text-primary size-4.5" />}
                  {dialog.type === "edit" && <Pencil className="size-4.5 text-blue-600" />}
                  {dialog.type === "delete" && <Trash2 className="size-4.5 text-red-600" />}
                  {dialog.type === "access" && <Key className="size-4.5 text-amber-600" />}
                </div>
                <h2 className="text-foreground text-lg font-semibold">
                  {dialog.type === "add" && "Add New User"}
                  {dialog.type === "edit" && "Edit User"}
                  {dialog.type === "delete" && "Delete User"}
                  {dialog.type === "access" && `User Access — ${dialog.user.firstName} ${dialog.user.lastName}`}
                </h2>
              </div>
              {!actionLoading && (
                <button onClick={() => setDialog(null)} className="text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg transition-colors">
                  <X className="size-4" />
                </button>
              )}
            </div>

            {dialog.type === "add" && <UserForm onSubmit={handleAdd} onCancel={() => setDialog(null)} isLoading={actionLoading} />}
            {dialog.type === "edit" && <UserForm user={dialog.user} onSubmit={handleEdit} onCancel={() => setDialog(null)} isLoading={actionLoading} />}

            {dialog.type === "access" && (
              <AccessManager
                user={dialog.user}
                onSave={async (access) => {
                  setActionLoading(true);
                  try {
                    const res = await fetch(`/api/users/${dialog.user.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        firstName: dialog.user.firstName,
                        lastName: dialog.user.lastName,
                        username: dialog.user.username,
                        email: dialog.user.email,
                        phone: dialog.user.phone,
                        role: dialog.user.role,
                        status: dialog.user.status,
                        sidebarAccess: access,
                      }),
                    });
                    if (res.ok) { setDialog(null); fetchData(); }
                  } finally { setActionLoading(false); }
                }}
                onCancel={() => setDialog(null)}
                isLoading={actionLoading}
              />
            )}

            {dialog.type === "delete" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-muted-foreground text-sm">
                    Are you sure you want to delete <span className="text-foreground font-semibold">{dialog.user.firstName} {dialog.user.lastName}</span> (@{dialog.user.username})? This action cannot be undone.
                  </p>
                </div>
                <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
                  <button onClick={() => setDialog(null)} disabled={actionLoading} className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">Cancel</button>
                  <button onClick={handleDelete} disabled={actionLoading} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
                    {actionLoading ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Delete User
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

function AccessManager({ user, onSave, onCancel, isLoading }: { user: AppUser; onSave: (access: string[]) => void; onCancel: () => void; isLoading: boolean }) {
  const [access, setAccess] = useState<string[]>(user.sidebarAccess || []);

  const toggle = (key: string) => {
    setAccess((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">Select which sidebar modules <span className="text-foreground font-semibold">{user.firstName}</span> can access.</p>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-6">
        {Object.entries(SIDEBAR_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
              access.includes(key) ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
        <button onClick={onCancel} disabled={isLoading} className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50">Cancel</button>
        <button onClick={() => onSave(access)} disabled={isLoading} className="btn-gradient text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:opacity-50">
          {isLoading ? "Saving..." : "Save Access"}
        </button>
      </div>
    </div>
  );
}
