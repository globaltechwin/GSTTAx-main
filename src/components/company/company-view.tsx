import type { Company } from "@/lib/data";
import { X, Building2, Mail, Phone, MapPin, Calendar, ShieldCheck } from "lucide-react";

interface CompanyViewProps {
  company: Company;
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

export function CompanyView({ company, onClose }: CompanyViewProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: {
      label: "Active",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
    },
    inactive: {
      label: "Inactive",
      className:
        "bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-400/20",
    },
    pending: {
      label: "Pending",
      className:
        "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
    },
    suspended: {
      label: "Suspended",
      className:
        "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20",
    },
  };

  const statusVal = company.status || "active";
  const statusInfo = statusConfig[statusVal] || statusConfig.active;

  const fields = [
    { label: "GST No", value: company.gstNo },
    { label: "PAN No", value: company.panNo },
    { label: "SSI No", value: company.ssiNo },
    { label: "ESI No", value: company.esiNo },
    { label: "EPF No", value: company.epfNo },
  ];

  return (
    <div className="space-y-5">
      {/* Company Header */}
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Building2 className="text-primary size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-foreground text-lg font-bold">{company.name}</h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>
          {company.address && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5" />
              {company.address}
            </p>
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

        {fields.map((field) => (
          <div key={field.label} className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {field.label}
            </p>
            <p className="text-foreground text-sm font-medium">
              {field.value || <span className="text-muted-foreground/40">—</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Contact Info */}
      <div className="border-border/60 border-t pt-4">
        <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
          Contact Information
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground/50 size-4" />
            <span className="text-foreground text-sm">
              {company.email || <span className="text-muted-foreground/40">No email</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="text-muted-foreground/50 size-4" />
            <span className="text-foreground text-sm">
              {company.phone || <span className="text-muted-foreground/40">No phone</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-muted-foreground/50 size-4" />
            <span className="text-foreground text-sm">
              {company.gstNo ? (
                <span className="font-mono">{company.gstNo}</span>
              ) : (
                <span className="text-muted-foreground/40">No GSTIN</span>
              )}
            </span>
          </div>
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
