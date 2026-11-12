"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, Search, RefreshCw, Building2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminWorkspace = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  status: string;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  hsnCode: string | null;
  unit: string;
  gstRate: string | number;
  purchaseRate: string | number;
  sellingRate: string | number;
  stock: string | number;
  minStock: string | number;
  status: string;
};

export function SuperadminProductsClient() {
  const [admins, setAdmins] = useState<AdminWorkspace[]>([]);
  const [adminId, setAdminId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");

  const selectedAdmin = useMemo(
    () => admins.find((admin) => String(admin.id) === adminId),
    [admins, adminId]
  );

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    setError("");
    try {
      const response = await fetch("/api/superadmin/admins?page=1&pageSize=100");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load Admin workspaces");
      const rows = (result.data ?? []) as AdminWorkspace[];
      setAdmins(rows);
      setAdminId((current) => current || (rows[0] ? String(rows[0].id) : ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Admin workspaces");
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    if (!adminId) {
      setProducts([]);
      return;
    }
    setLoadingProducts(true);
    setError("");
    try {
      const params = new URLSearchParams({ adminId, search });
      const response = await fetch(`/api/superadmin/products?${params.toString()}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load products");
      setProducts(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [adminId, search]);

  useEffect(() => { void loadAdmins(); }, [loadAdmins]);
  useEffect(() => { if (adminId) void loadProducts(); else setProducts([]); }, [adminId, loadProducts]);

  const lowStock = products.filter((product) => Number(product.stock) <= Number(product.minStock)).length;
  const activeCount = products.filter((product) => product.status === "active").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Package className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold">Product Management</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            View product catalogues across Admin workspaces. This page is read-only.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Eye className="size-3.5" /> Superadmin · Read only
        </span>
      </div>

      <section className="max-w-xl space-y-2 rounded-xl border p-4">
        <Label htmlFor="workspace">Select Admin workspace</Label>
        <div className="flex flex-wrap gap-2">
          <select
            id="workspace"
            value={adminId}
            onChange={(event) => setAdminId(event.target.value)}
            disabled={loadingAdmins || admins.length === 0}
            className="border-input bg-background h-10 min-w-0 flex-1 rounded-md border px-3 text-sm"
          >
            {admins.length === 0 && <option value="">No Admin workspaces found</option>}
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {`${admin.firstName} ${admin.lastName}`.trim() || admin.username} (@{admin.username}) · #{admin.id}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={() => void loadAdmins()} disabled={loadingAdmins}>
            <RefreshCw className="mr-2 size-4" /> Refresh workspaces
          </Button>
        </div>
        {selectedAdmin && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            Workspace status: {selectedAdmin.status}
          </p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total products</p>
          <p className="text-2xl font-semibold">{products.length}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Active products</p>
          <p className="text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">At / below minimum stock</p>
          <p className="text-2xl font-semibold">{lowStock}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, SKU or HSN"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => void loadProducts()} disabled={loadingProducts || !adminId}>
          <RefreshCw className="mr-2 size-4" /> Refresh products
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[950px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["Product", "SKU", "HSN", "GST", "Purchase rate", "Selling rate", "Stock", "Status"].map((heading) => (
                <th key={heading} className="px-3 py-3 text-left font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="px-3 py-3 font-medium">{product.name}</td>
                <td className="px-3 py-3">{product.sku}</td>
                <td className="px-3 py-3">{product.hsnCode || "—"}</td>
                <td className="px-3 py-3">{Number(product.gstRate)}%</td>
                <td className="px-3 py-3">₹{Number(product.purchaseRate).toFixed(2)}</td>
                <td className="px-3 py-3">₹{Number(product.sellingRate).toFixed(2)}</td>
                <td className="px-3 py-3">{Number(product.stock)} {product.unit}</td>
                <td className="px-3 py-3">{product.status}</td>
              </tr>
            ))}
            {!products.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {loadingProducts ? "Loading products…" : adminId ? "No products found for this workspace." : "Select an Admin workspace to view products."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
