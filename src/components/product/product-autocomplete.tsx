"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

export type WorkspaceProduct = {
  id: number;
  productCode: string;
  name: string;
  sku: string;
  hsnCode: string | null;
  unit: string;
  gstRate: string | number;
  purchaseRate: string | number;
  sellingRate: string | number;
  stock: string | number;
  minStock: string | number;
  description?: string | null;
  status: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: WorkspaceProduct) => void;
  placeholder?: string;
  className?: string;
};

const currency = (value: string | number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ProductAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search Product ID, name or SKU",
  className = "",
}: Props) {
  const [products, setProducts] = useState<WorkspaceProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/products?activeOnly=true")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load products");
        const json = await response.json();
        if (!cancelled) {
          setProducts((json.data || []).filter((product: WorkspaceProduct) => product.status === "active"));
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    const filtered = !query
      ? products
      : products.filter((product) =>
          [
            product.productCode,
            product.name,
            product.sku,
            product.hsnCode || "",
            product.description || "",
          ].some((field) => field.toLowerCase().includes(query)),
        );
    return filtered.slice(0, 10);
  }, [products, value]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const desiredHeight = Math.min(360, Math.max(150, matches.length * 104 + 12));
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < Math.min(desiredHeight, 240) && rect.top > spaceBelow;
      const width = Math.min(Math.max(rect.width, 320), window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      setMenuStyle({
        position: "fixed",
        zIndex: 99999,
        left,
        width,
        ...(placeAbove
          ? { bottom: Math.max(12, window.innerHeight - rect.top + 4), maxHeight: Math.max(120, rect.top - 20) }
          : { top: rect.bottom + 4, maxHeight: Math.max(120, window.innerHeight - rect.bottom - 16) }),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, matches.length]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  const menu = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="overflow-y-auto rounded-xl border border-border bg-card p-2 text-card-foreground shadow-2xl"
          role="listbox"
        >
          {matches.length > 0 ? (
            <div className="space-y-1">
              {matches.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                  className="block w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-primary/20 hover:bg-primary/5 focus:border-primary/30 focus:bg-primary/5 focus:outline-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{product.name}</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{product.productCode}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        SKU: {product.sku || "—"} <span className="px-1">·</span> HSN: {product.hsnCode || "—"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${Number(product.stock) <= Number(product.minStock) ? "bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700"}`}>
                      Stock: {Number(product.stock || 0).toLocaleString("en-IN")} {product.unit || ""}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/70 pt-2 text-[11px] sm:grid-cols-4">
                    <span><span className="text-muted-foreground">Unit:</span> <b>{product.unit || "—"}</b></span>
                    <span><span className="text-muted-foreground">GST:</span> <b>{Number(product.gstRate || 0)}%</b></span>
                    <span><span className="text-muted-foreground">Purchase:</span> <b>{currency(product.purchaseRate)}</b></span>
                    <span><span className="text-muted-foreground">Selling:</span> <b>{currency(product.sellingRate)}</b></span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              {loading ? "Loading products…" : "No active products found. You can keep entering a manual description."}
            </p>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? "Loading products…" : placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-autocomplete="list"
      />
      {menu}
    </>
  );
}
