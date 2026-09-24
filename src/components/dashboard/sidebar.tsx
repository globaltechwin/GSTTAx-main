"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import {
  LayoutDashboard,
  Building2,
  Send,
  FileText,
  Users,
  ArrowLeftRight,
  Settings,
  ChevronLeft,
  Receipt,
  ShoppingCart,
  UsersRound,
  BarChart3,
} from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "companies", label: "Company", href: "/dashboard/companies", icon: Building2 },
  { key: "to-companies", label: "To Company", href: "/dashboard/to-companies", icon: Send },
  { key: "invoices", label: "Invoice", href: "/dashboard/invoices", icon: FileText },
  { key: "purchases", label: "Purchase", href: "/dashboard/purchases", icon: ShoppingCart },
  { key: "turnover-report", label: "Turnover Report", href: "/dashboard/turnover-report", icon: BarChart3 },
  { key: "referrals", label: "Referral", href: "/dashboard/referrals", icon: Users },
  { key: "import-export", label: "Import/Export", href: "/dashboard/import-export", icon: ArrowLeftRight },
  { key: "users", label: "Users", href: "/dashboard/users", icon: UsersRound },
  { key: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface StoredUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  sidebarAccess: string[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gsttax_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const visibleItems =
    user && user.role !== "admin"
      ? navItems.filter((item) => user.sidebarAccess.includes(item.key))
      : navItems;

  return (
    <aside
      className={cn(
        "border-border/60 bg-card/95 fixed top-0 left-0 z-40 flex h-screen flex-col border-r backdrop-blur-sm transition-all duration-300",
        isCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="border-border/60 flex h-16 shrink-0 items-center gap-3 border-b px-4">
        <div className="bg-primary text-primary-foreground shadow-primary/20 inline-flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm">
          <Receipt className="size-5" strokeWidth={1.8} />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-foreground truncate text-base leading-none font-bold">GSTTax</h1>
            <p className="text-muted-foreground mt-0.5 truncate text-[10px]">Enterprise ERP</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    "size-[18px] shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-border/60 shrink-0 border-t p-3">
        <button
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex h-9 w-full items-center justify-center rounded-xl transition-all duration-200"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn("size-4 transition-transform duration-300", isCollapsed && "rotate-180")}
          />
        </button>
      </div>
    </aside>
  );
}
