"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Send,
  FileText,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  Zap,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { CompaniesTable } from "@/components/dashboard/companies-table";
import { useSession } from "@/components/auth/session-provider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const quickActions = [
  {
    label: "Add Company",
    icon: Building2,
    href: "/dashboard/companies",
    module: "companies",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    label: "New Invoice",
    icon: FileText,
    href: "/dashboard/invoices/new",
    module: "invoices",
    color: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20",
  },
  {
    label: "Add To Company",
    icon: Send,
    href: "/dashboard/to-companies",
    module: "to-companies",
    color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
  },
  {
    label: "View Reports",
    icon: TrendingUp,
    href: "/dashboard/turnover-report",
    module: "turnover-report",
    color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
  },
];

interface DashboardData {
  username: string;
  totalCompanies: number | null;
  totalToCompanies: number | null;
  totalInvoices: number | null;
  totalPurchases: number | null;
  canViewCompanies: boolean;
  canViewToCompanies: boolean;
  canViewInvoices: boolean;
  canViewPurchases: boolean;
  monthly: { month: string; invoices: number; purchases: number; revenue: number }[];
  recentActivity: {
    id: string;
    action: string;
    detail: string;
    createdAt: string;
    href: string;
    kind: "company" | "to-company" | "invoice" | "purchase";
  }[];
}

const activityStyles = {
  company: { icon: Building2, color: "text-primary" },
  "to-company": { icon: Send, color: "text-emerald-600" },
  invoice: { icon: FileText, color: "text-violet-600" },
  purchase: { icon: ShoppingCart, color: "text-amber-600" },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "\u{1F305}" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "\u{2600}\u{FE0F}" };
  if (hour < 21) return { text: "Good Evening", emoji: "\u{1F306}" };
  return { text: "Good Night", emoji: "\u{1F319}" };
}

function getCurrentTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getCurrentDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/20 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-semibold text-gray-800">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-semibold text-gray-800">
            {entry.name === "revenue" ? `\u20B9${entry.value.toLocaleString()}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [greeting, setGreeting] = useState(getGreeting());
  const [time, setTime] = useState(getCurrentTime());
  const [date] = useState(getCurrentDate());
  const [data, setData] = useState<DashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const { user } = useSession();
  const canViewModule = (module: string) =>
    user?.role !== "USER" || user.sidebarAccess.includes(module);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime());
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load dashboard");
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) {
          setDashboardError(error instanceof Error ? error.message : "Unable to load dashboard");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative min-h-full">
      {/* Subtle background pattern */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-dot-grid absolute inset-0 opacity-30" />
        <div className="animate-pulse-glow bg-primary/5 absolute top-0 right-0 h-96 w-96 rounded-full blur-3xl" />
        <div
          className="animate-pulse-glow absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="space-y-6">
        {/* Greeting Header */}
        <div className="animate-fade-in-up from-primary/5 relative overflow-hidden rounded-2xl bg-gradient-to-r via-violet-500/5 to-emerald-500/5 p-6">
          <div className="animate-drift bg-primary/10 absolute -top-12 -right-12 size-40 rounded-full blur-2xl" />
          <div
            className="animate-drift absolute -bottom-8 -left-8 size-32 rounded-full bg-violet-500/10 blur-2xl"
            style={{ animationDelay: "3s" }}
          />
          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <span className="animate-fade-in">{greeting.emoji}</span>
                  <span>
                    {greeting.text}, {user?.firstName || data?.username || "there"}!
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Welcome back. Here&apos;s what&apos;s happening with your business today.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-foreground text-sm font-semibold">{time}</p>
                  <p className="text-muted-foreground text-xs">{date}</p>
                </div>
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                  <Clock className="text-primary size-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {dashboardError && (
          <p
            className="text-destructive rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
            role="alert"
          >
            {dashboardError}
          </p>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {canViewModule("companies") && (
            <StatsCard
              title="Company"
              value={data?.totalCompanies ?? "—"}
              subtitle="Total Companies"
              icon={<Building2 className="size-5" strokeWidth={1.8} />}
              color="blue"
              delay={100}
              href="/dashboard/companies"
            />
          )}
          {canViewModule("to-companies") && (
            <StatsCard
              title="To Company"
              value={data?.totalToCompanies ?? "—"}
              subtitle="Total To Companies"
              icon={<Send className="size-5" strokeWidth={1.8} />}
              color="emerald"
              delay={200}
              href="/dashboard/to-companies"
            />
          )}
          {canViewModule("invoices") && (
            <StatsCard
              title="Invoice"
              value={data?.totalInvoices ?? "—"}
              subtitle="Total Invoices"
              icon={<FileText className="size-5" strokeWidth={1.8} />}
              color="violet"
              delay={300}
              href="/dashboard/invoices"
            />
          )}
          {canViewModule("purchases") && (
            <StatsCard
              title="Purchases"
              value={data?.totalPurchases ?? "—"}
              subtitle="Total Purchases"
              icon={<ShoppingCart className="size-5" strokeWidth={1.8} />}
              color="amber"
              delay={400}
              href="/dashboard/purchases"
            />
          )}
        </div>

        {/* Chart + Quick Actions Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chart */}
          <div
            className="animate-fade-in-up border-border/60 bg-card flex flex-col rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-2"
            style={{ animationDelay: "500ms" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-foreground text-lg font-semibold">Business Overview</h2>
                <p className="text-muted-foreground text-sm">Invoices & purchases over time</p>
              </div>
              {(canViewModule("invoices") || canViewModule("purchases")) && (
                <div className="flex items-center gap-4">
                  {canViewModule("invoices") && (
                    <div className="flex items-center gap-1.5">
                      <div className="bg-primary size-2.5 rounded-full" />
                      <span className="text-muted-foreground text-xs">Invoices</span>
                    </div>
                  )}
                  {canViewModule("purchases") && (
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground text-xs">Purchases</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.monthly ?? []}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="invoicesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.38 0.15 265)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.38 0.15 265)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.915 0.005 250)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "oklch(0.5 0.01 250)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "oklch(0.5 0.01 250)", fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="invoices"
                    stroke="oklch(0.38 0.15 265)"
                    strokeWidth={2.5}
                    fill="url(#invoicesGradient)"
                    animationDuration={2000}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#purchasesGradient)"
                    animationDuration={2000}
                    animationEasing="ease-out"
                    animationBegin={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-6">
            {/* Quick Actions */}
            <div
              className="animate-fade-in-up border-border/60 bg-card rounded-2xl border p-5 shadow-sm"
              style={{ animationDelay: "600ms" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <h3 className="text-foreground text-sm font-semibold">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickActions
                  .filter(
                    (action) => user?.role !== "USER" || user.sidebarAccess.includes(action.module)
                  )
                  .map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group flex items-center gap-2.5 rounded-xl p-3 text-sm font-medium transition-all duration-200 hover:scale-[1.03] hover:shadow-md"
                    >
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${action.color}`}
                      >
                        <action.icon className="size-4" />
                      </div>
                      <span className="text-foreground text-xs font-medium">{action.label}</span>
                      <ArrowRight className="text-muted-foreground ml-auto size-3 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="animate-fade-in-up border-border/60 bg-card rounded-2xl border p-5 shadow-sm"
              style={{ animationDelay: "700ms" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Activity className="size-4 text-violet-500" />
                <h3 className="text-foreground text-sm font-semibold">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {!data ? (
                  <p className="text-muted-foreground p-2 text-sm">Loading recent activity...</p>
                ) : data.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground p-2 text-sm">No recent activity.</p>
                ) : (
                  data.recentActivity.map((item) => {
                    const style = activityStyles[item.kind];
                    const Icon = style.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="group hover:bg-muted/30 flex items-start gap-3 rounded-lg p-2 transition-all duration-200 hover:scale-[1.01]"
                      >
                        <div className="bg-muted/50 group-hover:bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors">
                          <Icon className={`size-4 ${style.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground text-sm font-medium">{item.action}</p>
                          <p className="text-muted-foreground truncate text-xs">{item.detail}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <time
                            className="text-muted-foreground text-[11px]"
                            dateTime={item.createdAt}
                          >
                            {new Date(item.createdAt).toLocaleString()}
                          </time>
                          <ChevronRight className="text-muted-foreground/0 group-hover:text-muted-foreground/60 size-3 transition-all duration-200 group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        {(user?.role !== "USER" || user.sidebarAccess.includes("companies")) && (
          <div className="animate-fade-in-up" style={{ animationDelay: "800ms" }}>
            <CompaniesTable />
          </div>
        )}
      </div>
    </div>
  );
}
