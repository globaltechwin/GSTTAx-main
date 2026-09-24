"use client";

import { useState, useEffect } from "react";
import { useSidebarStore } from "@/stores/sidebar";
import { cn } from "@/lib/utils";
import { Search, Bell, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface StoredUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

export function TopNav() {
  const { isCollapsed } = useSidebarStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gsttax_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = () => setMenuOpen(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);

  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "A";
  const displayName = user ? `${user.firstName} ${user.lastName}` : "Admin";
  const displayRole = user?.role === "admin" ? "Administrator" : "User";

  return (
    <header
      className={cn(
        "border-border/60 bg-card/80 fixed top-0 right-0 z-30 flex h-16 items-center border-b backdrop-blur-sm transition-all duration-300",
        isCollapsed ? "left-[68px]" : "left-64"
      )}
    >
      <div className="flex w-full items-center justify-between px-6">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="text-muted-foreground/60 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="border-border/60 bg-muted/30 placeholder:text-muted-foreground/40 focus:ring-primary/20 focus:border-primary/30 h-9 w-64 rounded-xl border pr-4 pl-9 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </div>

          <button className="text-muted-foreground hover:text-foreground hover:bg-muted/50 relative inline-flex size-9 items-center justify-center rounded-xl transition-all duration-200">
            <Bell className="size-[18px]" strokeWidth={1.8} />
            <span className="bg-destructive ring-card absolute top-1.5 right-1.5 size-2 rounded-full ring-2" />
          </button>

          <div className="bg-border/60 hidden h-6 w-px sm:block" />

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/50"
            >
              <div className="from-primary to-primary/80 text-primary-foreground shadow-primary/20 flex size-8 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-foreground text-sm leading-none font-semibold">{displayName}</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">{displayRole}</p>
              </div>
              <ChevronDown className={cn("text-muted-foreground size-3.5 transition-transform", menuOpen && "rotate-180")} />
            </button>

            {menuOpen && (
              <div className="border-border/60 bg-popover animate-fade-in absolute right-0 z-50 mt-2 w-56 rounded-xl border p-1.5 shadow-xl">
                <div className="border-border/60 flex items-center gap-3 border-b px-3 py-3">
                  <div className="from-primary to-primary/80 text-primary-foreground flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold">{displayName}</p>
                    <p className="text-muted-foreground text-xs">{displayRole}</p>
                  </div>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      localStorage.removeItem("gsttax_user");
                      router.push("/");
                    }}
                    className="text-destructive hover:bg-destructive/5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
