"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";

interface SettingFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
  horizontal?: boolean;
}

export function SettingField({
  label,
  description,
  required,
  error,
  tooltip,
  children,
  className,
  horizontal,
}: SettingFieldProps) {
  return (
    <div
      className={cn(
        horizontal ? "flex items-center justify-between gap-4" : "space-y-2",
        className
      )}
    >
      <div className={cn(horizontal ? "min-w-0 flex-1" : "")}>
        <div className="flex items-center gap-1.5">
          <label className="text-foreground text-sm font-medium">{label}</label>
          {required && <span className="text-destructive text-xs">*</span>}
          {tooltip && (
            <div className="group relative">
              <Info className="text-muted-foreground/50 size-3.5 cursor-help" />
              <div className="bg-foreground text-primary-foreground absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg group-hover:block">
                {tooltip}
                <div className="bg-foreground absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" />
              </div>
            </div>
          )}
        </div>
        {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
      </div>
      <div className={cn(horizontal ? "shrink-0" : "")}>{children}</div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs">
          <AlertCircle className="text-destructive size-3" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

interface SettingSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingSection({ title, description, children, className }: SettingSectionProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <h3 className="text-foreground text-base font-semibold">{title}</h3>
        {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

interface SettingDividerProps {
  className?: string;
}

export function SettingDivider({ className }: SettingDividerProps) {
  return <hr className={cn("border-border/60", className)} />;
}
