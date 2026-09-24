import type { Referral } from "@/lib/data";
import { X, Users } from "lucide-react";

interface ReferralViewProps {
  referral: Referral;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ReferralView({ referral, onClose }: ReferralViewProps) {
  const fields = [
    { label: "Referral Name", value: referral.name },
    { label: "Referral Email", value: referral.email },
    { label: "Referral Mobile", value: referral.mobile },
    { label: "Date", value: referral.date ? formatDate(referral.date) : "" },
  ];

  return (
    <div className="space-y-5">
      {/* Referral Header */}
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Users className="text-primary size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-lg font-bold">{referral.name}</h3>
          {referral.email && (
            <span className="bg-primary/10 text-primary mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
              {referral.email}
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {field.label}
            </p>
            <p className="text-foreground text-sm font-medium">
              {field.value || <span className="text-muted-foreground/40">-</span>}
            </p>
          </div>
        ))}
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
