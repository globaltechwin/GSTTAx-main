"use client";

import { useState } from "react";
import { useSettingsStore, type SettingsCategory } from "@/stores/settings";
import { cn } from "@/lib/utils";
import {
  Settings,
  Building2,
  CreditCard,
  FileText,
  Receipt,
  Bell,
  Printer,
  Users,
  Shield,
  HardDrive,
  Palette,
  Link,
  SlidersHorizontal,
  Search,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";

interface NavItem {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "company", label: "Company", icon: Building2 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "invoice", label: "Invoice", icon: FileText },
  { id: "gst-tax", label: "GST & Tax", icon: Receipt },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "printing", label: "Printing", icon: Printer },
  { id: "users-roles", label: "Users & Roles", icon: Users },
  { id: "security", label: "Security", icon: Shield },
  { id: "backup-restore", label: "Backup & Restore", icon: HardDrive },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Link },
  { id: "system-preferences", label: "System Preferences", icon: SlidersHorizontal },
];

export function SettingsLayout() {
  const { activeCategory, setActiveCategory } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const filteredNav = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeItem = navItems.find((item) => item.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <a href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </a>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">Settings</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
            <Settings className="text-primary size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Configure your ERP application preferences
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Navigation */}
        <div className="w-full shrink-0 lg:w-64">
          {/* Mobile Nav Toggle */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="border-border/60 bg-card mb-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all lg:hidden"
          >
            <span className="flex items-center gap-2">
              {activeItem && <activeItem.icon className="text-primary size-4" />}
              {activeItem?.label || "Settings"}
            </span>
            <Menu className="text-muted-foreground size-4" />
          </button>

          {/* Search */}
          <div className={cn("relative mb-3", !mobileNavOpen && "hidden lg:block")}>
            <Search className="text-muted-foreground/50 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="border-border/60 bg-card focus:ring-primary/20 h-9 w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition-all focus:ring-2 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Nav Items */}
          <div className={cn("space-y-0.5", !mobileNavOpen && "hidden lg:block")}>
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveCategory(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
                  <span className="truncate">{item.label}</span>
                  {isActive && <ChevronRight className="ml-auto size-3.5" />}
                </button>
              );
            })}
            {filteredNav.length === 0 && (
              <p className="text-muted-foreground px-3 py-4 text-center text-sm">
                No settings found
              </p>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="min-w-0 flex-1">
          <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
            {/* Panel Header */}
            <div className="border-border/60 mb-6 border-b pb-4">
              <div className="flex items-center gap-2.5">
                {activeItem && (
                  <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                    <activeItem.icon className="text-primary size-4" />
                  </div>
                )}
                <div>
                  <h2 className="text-foreground text-lg font-semibold">{activeItem?.label}</h2>
                  <p className="text-muted-foreground text-xs">
                    Configure your {activeItem?.label.toLowerCase()} settings
                  </p>
                </div>
              </div>
            </div>

            {/* Panel Content */}
            <div className="animate-fade-in">
              <PanelContent category={activeCategory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelContent({ category }: { category: SettingsCategory }) {
  switch (category) {
    case "general":
      return <GeneralPanel />;
    case "company":
      return <CompanyPanel />;
    case "billing":
      return <BillingPanel />;
    case "invoice":
      return <InvoicePanel />;
    case "gst-tax":
      return <GstTaxPanel />;
    case "notifications":
      return <NotificationsPanel />;
    case "printing":
      return <PrintingPanel />;
    case "users-roles":
      return <UsersRolesPanel />;
    case "security":
      return <SecurityPanel />;
    case "backup-restore":
      return <BackupPanel />;
    case "appearance":
      return <AppearancePanel />;
    case "integrations":
      return <IntegrationsPanel />;
    case "system-preferences":
      return <SystemPreferencesPanel />;
    default:
      return <GeneralPanel />;
  }
}

import { GeneralPanel } from "@/components/settings/panels/general-panel";
import { CompanyPanel } from "@/components/settings/panels/company-panel";
import { BillingPanel } from "@/components/settings/panels/billing-panel";
import { InvoicePanel } from "@/components/settings/panels/invoice-panel";
import { GstTaxPanel } from "@/components/settings/panels/gst-tax-panel";
import { NotificationsPanel } from "@/components/settings/panels/notifications-panel";
import { PrintingPanel } from "@/components/settings/panels/printing-panel";
import { UsersRolesPanel } from "@/components/settings/panels/users-roles-panel";
import { SecurityPanel } from "@/components/settings/panels/security-panel";
import { BackupPanel } from "@/components/settings/panels/backup-panel";
import { AppearancePanel } from "@/components/settings/panels/appearance-panel";
import { IntegrationsPanel } from "@/components/settings/panels/integrations-panel";
import { SystemPreferencesPanel } from "@/components/settings/panels/system-preferences-panel";
