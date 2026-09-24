import type { ToCompany } from "@/lib/data";
import { X, Building2, Hash, Calendar, FileText } from "lucide-react";

interface ToCompanyViewProps {
  company: ToCompany;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ToCompanyView({ company, onClose }: ToCompanyViewProps) {
  return (
    <div className="space-y-5">
      {/* Company Header */}
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Building2 className="text-primary size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-lg font-bold">{company.name}</h3>
          {company.vendorCode && (
            <span className="bg-primary/10 text-primary mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
              Vendor: {company.vendorCode}
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Date</p>
          <p className="text-foreground flex items-center gap-2 text-sm font-medium">
            <Calendar className="text-muted-foreground/50 size-4" />
            {company.date ? (
              formatDate(company.date)
            ) : (
              <span className="text-muted-foreground/40">—</span>
            )}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            GST No
          </p>
          <p className="text-foreground flex items-center gap-2 text-sm font-medium">
            <FileText className="text-muted-foreground/50 size-4" />
            {company.gstNo ? (
              <span className="font-mono">{company.gstNo}</span>
            ) : (
              <span className="text-muted-foreground/40">Not registered</span>
            )}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Vendor Code
          </p>
          <p className="text-foreground flex items-center gap-2 text-sm font-medium">
            <Hash className="text-muted-foreground/50 size-4" />
            {company.vendorCode || <span className="text-muted-foreground/40">—</span>}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">ID</p>
          <p className="text-foreground text-sm font-medium">
            <span className="bg-muted/50 rounded-md px-2 py-0.5 font-mono text-xs">
              #{company.id}
            </span>
          </p>
        </div>
      </div>

      {/* Close Button */}
      <div className="border-border/60 flex justify-end border-t pt-5">
        <button
          onClick={onClose}
          className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          <X className="size-4" />
          Close
        </button>
      </div>
    </div>
  );
}
