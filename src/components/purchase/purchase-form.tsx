"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { purchaseSchema, type PurchaseFormData } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InvoiceOption {
  id: number;
  orderId: string;
  invoiceNo: string | null;
  date: string;
  gst: string | null;
  amount: string | null;
  total: string | null;
  cgstRate: string;
  sgstRate: string;
  igstRate: string;
  billToName: string | null;
  billToGstin: string | null;
  billToState: string | null;
  company: { name: string } | null;
  toCompany: { name: string; gstNo: string | null; state: string | null } | null;
}

interface PurchaseFormProps {
  purchase?: {
    id: number;
    gstNo: string | null;
    partyName: string;
    invoiceNo: string;
    invoiceDate: string | Date;
    state: string | null;
    rate: number | string;
    taxableValue: number | string;
    igst: number | string;
    cgst: number | string;
    sgst: number | string;
    totalAmount: number | string;
  };
  onSubmit: (data: PurchaseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PurchaseForm({ purchase, onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      gstNo: purchase?.gstNo ?? "",
      partyName: purchase?.partyName ?? "",
      invoiceNo: purchase?.invoiceNo ?? "",
      invoiceDate: purchase?.invoiceDate
        ? typeof purchase.invoiceDate === "string"
          ? purchase.invoiceDate.slice(0, 10)
          : purchase.invoiceDate.toISOString().slice(0, 10)
        : "",
      state: purchase?.state ?? "",
      rate: Number(purchase?.rate ?? 0),
      taxableValue: Number(purchase?.taxableValue ?? 0),
      igst: Number(purchase?.igst ?? 0),
      cgst: Number(purchase?.cgst ?? 0),
      sgst: Number(purchase?.sgst ?? 0),
      totalAmount: Number(purchase?.totalAmount ?? 0),
    },
  });

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch("/api/invoices/list");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch {
      } finally {
        setInvoicesLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (purchase) {
      reset({
        gstNo: purchase.gstNo ?? "",
        partyName: purchase.partyName,
        invoiceNo: purchase.invoiceNo,
        invoiceDate:
          typeof purchase.invoiceDate === "string"
            ? purchase.invoiceDate.slice(0, 10)
            : purchase.invoiceDate.toISOString().slice(0, 10),
        state: purchase.state ?? "",
        rate: Number(purchase.rate),
        taxableValue: Number(purchase.taxableValue),
        igst: Number(purchase.igst),
        cgst: Number(purchase.cgst),
        sgst: Number(purchase.sgst),
        totalAmount: Number(purchase.totalAmount),
      });
    }
  }, [purchase, reset]);

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOrderId = e.target.value;
    const inv = invoices.find((i) => i.orderId === selectedOrderId);
    if (!inv) return;

    const partyName = inv.billToName || inv.toCompany?.name || inv.company?.name || "";
    const gstNo = inv.billToGstin || inv.toCompany?.gstNo || inv.gst || "";
    const state = inv.billToState || inv.toCompany?.state || "";
    const rate = Number(inv.cgstRate) + Number(inv.sgstRate) || Number(inv.igstRate) || 0;
    const taxableValue = Number(inv.amount || 0);
    const igst = Number(inv.igstRate) > 0 ? (taxableValue * Number(inv.igstRate)) / 100 : 0;
    const cgst = Number(inv.cgstRate) > 0 ? (taxableValue * Number(inv.cgstRate)) / 100 : 0;
    const sgst = Number(inv.sgstRate) > 0 ? (taxableValue * Number(inv.sgstRate)) / 100 : 0;
    const totalAmount = Number(inv.total || 0) || taxableValue + igst + cgst + sgst;

    const dateStr = inv.date ? new Date(inv.date).toISOString().slice(0, 10) : "";

    setValue("invoiceNo", inv.invoiceNo || inv.orderId);
    setValue("invoiceDate", dateStr);
    setValue("partyName", partyName);
    setValue("gstNo", gstNo);
    setValue("state", state);
    setValue("rate", rate);
    setValue("taxableValue", taxableValue);
    setValue("igst", igst);
    setValue("cgst", cgst);
    setValue("sgst", sgst);
    setValue("totalAmount", totalAmount);
  };

  const selectedInvoiceNo = watch("invoiceNo");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="partyName">
            Party Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="partyName"
            {...register("partyName")}
            aria-invalid={!!errors.partyName}
          />
          {errors.partyName && (
            <p className="text-destructive text-xs">{errors.partyName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceSelect">
            Invoice Number <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <select
              id="invoiceSelect"
              value={selectedInvoiceNo}
              onChange={handleInvoiceChange}
              className={cn(
                "border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm transition-all focus:ring-2 focus:outline-none",
                !selectedInvoiceNo && "text-muted-foreground"
              )}
            >
              <option value="">
                {invoicesLoading ? "Loading invoices..." : "Select an invoice"}
              </option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.orderId} className="text-foreground">
                  {inv.invoiceNo || inv.orderId}
                  {inv.billToName ? ` — ${inv.billToName}` : ""}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
              <svg className="text-muted-foreground size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <Input
            id="invoiceNo"
            type="hidden"
            {...register("invoiceNo")}
          />
          {errors.invoiceNo && (
            <p className="text-destructive text-xs">{errors.invoiceNo.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceDate">
            Invoice Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="invoiceDate"
            type="date"
            {...register("invoiceDate")}
            aria-invalid={!!errors.invoiceDate}
          />
          {errors.invoiceDate && (
            <p className="text-destructive text-xs">{errors.invoiceDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gstNo">GST No</Label>
          <Input id="gstNo" {...register("gstNo")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...register("state")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate">Rate (%)</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            {...register("rate")}
            aria-invalid={!!errors.rate}
          />
          {errors.rate && (
            <p className="text-destructive text-xs">{errors.rate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxableValue">Taxable Value</Label>
          <Input
            id="taxableValue"
            type="number"
            step="0.01"
            {...register("taxableValue")}
            aria-invalid={!!errors.taxableValue}
          />
          {errors.taxableValue && (
            <p className="text-destructive text-xs">{errors.taxableValue.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="igst">IGST</Label>
          <Input
            id="igst"
            type="number"
            step="0.01"
            {...register("igst")}
            aria-invalid={!!errors.igst}
          />
          {errors.igst && (
            <p className="text-destructive text-xs">{errors.igst.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cgst">CGST</Label>
          <Input
            id="cgst"
            type="number"
            step="0.01"
            {...register("cgst")}
            aria-invalid={!!errors.cgst}
          />
          {errors.cgst && (
            <p className="text-destructive text-xs">{errors.cgst.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sgst">SGST</Label>
          <Input
            id="sgst"
            type="number"
            step="0.01"
            {...register("sgst")}
            aria-invalid={!!errors.sgst}
          />
          {errors.sgst && (
            <p className="text-destructive text-xs">{errors.sgst.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalAmount">
            Total Invoice Value <span className="text-destructive">*</span>
          </Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            {...register("totalAmount")}
            aria-invalid={!!errors.totalAmount}
          />
          {errors.totalAmount && (
            <p className="text-destructive text-xs">{errors.totalAmount.message}</p>
          )}
        </div>
      </div>
      <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-gradient text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? "Saving..." : purchase ? "Update Purchase" : "Add Purchase"}
        </button>
      </div>
    </form>
  );
}
