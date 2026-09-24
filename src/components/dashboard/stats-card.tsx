"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color?: "blue" | "emerald" | "violet" | "amber";
  trend?: { value: number; label: string };
  delay?: number;
  href?: string;
}

const colorMap = {
  blue: {
    gradient: "from-primary via-primary/90 to-primary/70",
    iconBg: "bg-white/20",
    iconGlow: "shadow-primary/30",
    ringColor: "ring-primary/20",
    bgPattern: "bg-primary/5",
    trendUp: "text-primary",
  },
  emerald: {
    gradient: "from-emerald-600 via-emerald-500 to-emerald-400",
    iconBg: "bg-white/20",
    iconGlow: "shadow-emerald-500/30",
    ringColor: "ring-emerald-500/20",
    bgPattern: "bg-emerald-500/5",
    trendUp: "text-emerald-600",
  },
  violet: {
    gradient: "from-violet-600 via-violet-500 to-violet-400",
    iconBg: "bg-white/20",
    iconGlow: "shadow-violet-500/30",
    ringColor: "ring-violet-500/20",
    bgPattern: "bg-violet-500/5",
    trendUp: "text-violet-600",
  },
  amber: {
    gradient: "from-amber-600 via-amber-500 to-amber-400",
    iconBg: "bg-white/20",
    iconGlow: "shadow-amber-500/30",
    ringColor: "ring-amber-500/20",
    bgPattern: "bg-amber-500/5",
    trendUp: "text-amber-600",
  },
};

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  trend,
  delay = 0,
  href,
}: StatsCardProps) {
  const colors = colorMap[color];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const cardContent = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/20 shadow-lg transition-all duration-500",
        "hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 hover:scale-[1.02]",
        "active:scale-[0.98] active:shadow-lg",
        href && "cursor-pointer",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient Header */}
      <div className={cn("relative bg-gradient-to-r px-5 py-4", colors.gradient)}>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-150" />
        <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-white/5 transition-transform duration-700 group-hover:scale-125" />

        {/* Icon with glow */}
        <div className="relative flex items-center gap-3">
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30",
              colors.iconGlow
            )}
          >
            {icon}
          </div>
          <span className="text-sm font-semibold text-white/90">{title}</span>
          {href && (
            <div className="ml-auto flex size-6 items-center justify-center rounded-full bg-white/0 text-white/60 transition-all duration-300 group-hover:bg-white/20 group-hover:text-white">
              <ArrowUpRight className="size-3.5" />
            </div>
          )}
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      {/* Value Section */}
      <div className="relative bg-card px-5 py-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{subtitle}</p>
          </div>
          <div className="text-right">
            {typeof value === "number" ? (
              <span className="text-foreground text-3xl font-bold tabular-nums tracking-tight">
                <AnimatedNumber value={value} />
              </span>
            ) : (
              <span className="text-foreground text-xl font-bold tracking-tight">{value}</span>
            )}
          </div>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                trend.value >= 0
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-600"
              )}
            >
              {trend.value >= 0 ? (
                <svg className="size-3" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2L10 7H2L6 2Z" fill="currentColor" />
                </svg>
              ) : (
                <svg className="size-3" viewBox="0 0 12 12" fill="none">
                  <path d="M6 10L2 5H10L6 10Z" fill="currentColor" />
                </svg>
              )}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground text-[11px]">{trend.label}</span>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className={cn("h-0.5 bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100", colors.gradient)} />
    </div>
  );

  if (href) {
    return <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl">{cardContent}</Link>;
  }

  return cardContent;
}
