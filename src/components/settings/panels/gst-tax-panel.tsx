"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw } from "lucide-react";

function Toggle({
  checked,
  onToggle,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      <button
        onClick={() => {
          onToggle();
          onChange?.();
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

export function GstTaxPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [defaultCgst, setDefaultCgst] = useState("9");
  const [defaultSgst, setDefaultSgst] = useState("9");
  const [defaultIgst, setDefaultIgst] = useState("18");
  const [hsnRequired, setHsnRequired] = useState(true);
  const [gstReturnFiling, setGstReturnFiling] = useState("monthly");
  const [gstin, setGstin] = useState("33AABCM1234N1Z5");

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection
        title="GST Configuration"
        description="Set up Goods and Services Tax settings"
      >
        <SettingField label="Enable GST" horizontal tooltip="Enable GST calculations on invoices">
          <button
            onClick={() => {
              setGstEnabled(!gstEnabled);
              handleChange();
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${gstEnabled ? "bg-primary" : "bg-muted"}`}
            role="switch"
            aria-checked={gstEnabled}
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${gstEnabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </SettingField>

        <SettingField label="GSTIN" tooltip="Your 15-digit GST Identification Number">
          <input
            type="text"
            value={gstin}
            onChange={(e) => {
              setGstin(e.target.value);
              handleChange();
            }}
            className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 font-mono text-sm transition-all focus:ring-2 focus:outline-none"
          />
        </SettingField>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Default Tax Rates" description="Pre-fill tax rates on new items">
        <div className="grid gap-5 md:grid-cols-3">
          <SettingField label="CGST Rate (%)" tooltip="Central GST rate">
            <select
              value={defaultCgst}
              onChange={(e) => {
                setDefaultCgst(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="0">0%</option>
              <option value="2.5">2.5%</option>
              <option value="6">6%</option>
              <option value="9">9%</option>
              <option value="14">14%</option>
            </select>
          </SettingField>

          <SettingField label="SGST Rate (%)" tooltip="State GST rate">
            <select
              value={defaultSgst}
              onChange={(e) => {
                setDefaultSgst(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="0">0%</option>
              <option value="2.5">2.5%</option>
              <option value="6">6%</option>
              <option value="9">9%</option>
              <option value="14">14%</option>
            </select>
          </SettingField>

          <SettingField label="IGST Rate (%)" tooltip="Integrated GST rate for inter-state">
            <select
              value={defaultIgst}
              onChange={(e) => {
                setDefaultIgst(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Compliance" description="Tax filing and compliance settings">
        <div className="space-y-4">
          <SettingField label="GST Return Filing" tooltip="How often you file GST returns">
            <select
              value={gstReturnFiling}
              onChange={(e) => {
                setGstReturnFiling(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full max-w-sm rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly (QRMP)</option>
            </select>
          </SettingField>

          <Toggle
            checked={hsnRequired}
            onToggle={() => setHsnRequired(!hsnRequired)}
            label="Require HSN Code"
            description="Mandatory HSN code on all items"
            onChange={handleChange}
          />
        </div>
      </SettingSection>

      <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
        <button className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all">
          <RotateCcw className="size-4" />
          Reset
        </button>
        <button className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold shadow-sm transition-all">
          <Save className="size-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
