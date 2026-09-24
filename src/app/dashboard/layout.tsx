"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { useSidebarStore } from "@/stores/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <TopNav />
      <main
        className={cn("pt-16 transition-all duration-300", isCollapsed ? "pl-[68px]" : "pl-64")}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
