"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";

export function SuperadminPortalShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();

  return (
    <SessionProvider>
      <div className="bg-background min-h-screen">
        <Sidebar />
        <TopNav />
        <main
          className={cn(
            "pt-16 transition-all duration-300 md:pl-64",
            isCollapsed ? "md:pl-[68px]" : "md:pl-64"
          )}
        >
          <div className="mx-auto max-w-7xl space-y-4 p-6">
            <p className="border-border/60 bg-muted/40 text-muted-foreground rounded-lg border px-4 py-3 text-sm">
              Platform business records are shown across Admin workspaces in read-only mode.
              Platform Settings are saved separately from workspace settings.
            </p>
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
