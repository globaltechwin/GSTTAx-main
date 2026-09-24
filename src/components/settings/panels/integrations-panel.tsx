"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw, Link, CheckCircle2, AlertTriangle } from "lucide-react";

interface Integration {
  id: number;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

const integrations: Integration[] = [
  {
    id: 1,
    name: "Tally ERP",
    description: "Sync invoices and journal entries with Tally",
    connected: true,
    icon: "T",
  },
  {
    id: 2,
    name: "WhatsApp Business",
    description: "Send invoices and notifications via WhatsApp",
    connected: true,
    icon: "W",
  },
  {
    id: 3,
    name: "Razorpay",
    description: "Accept online payments via Razorpay gateway",
    connected: false,
    icon: "R",
  },
  {
    id: 4,
    name: "Google Drive",
    description: "Automatic backup to Google Drive",
    connected: false,
    icon: "G",
  },
  {
    id: 5,
    name: "Zoho Books",
    description: "Two-way sync with Zoho Books accounting",
    connected: false,
    icon: "Z",
  },
  {
    id: 6,
    name: "GSTN Portal",
    description: "Direct GST return filing integration",
    connected: false,
    icon: "S",
  },
];

export function IntegrationsPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);

  return (
    <div className="space-y-8">
      <SettingSection
        title="Available Integrations"
        description="Connect your ERP with third-party services"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="border-border/60 bg-card rounded-xl border p-4 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl text-sm font-bold">
                    {integration.icon}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-semibold">{integration.name}</p>
                    <p className="text-muted-foreground text-xs">{integration.description}</p>
                  </div>
                </div>
              </div>
              <div className="border-border/60 mt-3 flex items-center justify-between border-t pt-3">
                {integration.connected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="size-3" /> Connected
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">Not connected</span>
                )}
                <button
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    integration.connected
                      ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  <Link className="size-3" />
                  {integration.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SettingSection>

      <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
        <button className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold shadow-sm transition-all">
          <Save className="size-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
