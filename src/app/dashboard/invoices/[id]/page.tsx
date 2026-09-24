"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { InvoiceTemplate, type InvoicePrintData } from "@/components/invoice/invoice-template";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function InvoicePreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoicePrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setInvoice(data);
        } else if (!cancelled) {
          setError("Invoice not found");
        }
      } catch {
        if (!cancelled) setError("Failed to load invoice");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="text-primary size-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="size-8 text-red-500" />
          <p className="text-foreground font-medium">{error || "Invoice not found"}</p>
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 size-4" />
              Back to Invoices
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Non-printable header */}
      <div className="no-print space-y-4">
        <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span className="size-3.5">/</span>
          <Link href="/dashboard/invoices" className="hover:text-foreground transition-colors">
            Invoices
          </Link>
          <span className="size-3.5">/</span>
          <span className="text-foreground font-medium">
            Invoice #{invoice.invoiceNo || invoice.orderId}
          </span>
        </nav>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/invoices"
              className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <div>
              <h1 className="text-foreground text-xl font-bold tracking-tight">Invoice Preview</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Invoice #{invoice.invoiceNo || invoice.orderId} — Print or download as PDF
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="size-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice preview */}
      <div className="no-print-none border-border/60 bg-card mx-auto max-w-[900px] overflow-x-auto rounded-2xl border p-4 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <InvoiceTemplate invoice={invoice} />
      </div>
    </div>
  );
}
