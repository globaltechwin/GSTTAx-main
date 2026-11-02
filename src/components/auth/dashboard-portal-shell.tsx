"use client";

import { SessionProvider } from "@/components/auth/session-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";

export function DashboardPortalShell({ children }: { children: React.ReactNode }) {
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
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
