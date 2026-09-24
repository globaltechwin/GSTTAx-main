"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw } from "lucide-react";

export function InvoicePanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [theme, setTheme] = useState("professional");
  const [printTemplate, setPrintTemplate] = useState("standard");
  const [qrCode, setQrCode] = useState(true);
  const [signature, setSignature] = useState(false);
  const [watermark, setWatermark] = useState(false);
  const [footerNotes, setFooterNotes] = useState("This is a computer-generated invoice.");

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection title="Invoice Template" description="Choose how your invoices look">
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="Invoice Theme" tooltip="Visual theme for invoices">
            <select
              value={theme}
              onChange={(e) => {
                setTheme(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="professional">Professional (Blue)</option>
              <option value="modern">Modern (Dark)</option>
              <option value="minimal">Minimal (Clean)</option>
              <option value="classic">Classic (Formal)</option>
            </select>
          </SettingField>

          <SettingField label="Print Template" tooltip="Layout template for printed invoices">
            <select
              value={printTemplate}
              onChange={(e) => {
                setPrintTemplate(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="standard">Standard A4</option>
              <option value="compact">Compact</option>
              <option value="detailed">Detailed</option>
            </select>
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Invoice Elements"
        description="Control what appears on printed invoices"
      >
        <div className="space-y-4">
          <SettingField
            label="Show QR Code"
            horizontal
            tooltip="Display UPI/ payment QR code on invoice"
          >
            <button
              onClick={() => {
                setQrCode(!qrCode);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${qrCode ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={qrCode}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${qrCode ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </SettingField>

          <SettingField
            label="Show Signature"
            horizontal
            tooltip="Include authorized signature area"
          >
            <button
              onClick={() => {
                setSignature(!signature);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${signature ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={signature}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${signature ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </SettingField>

          <SettingField
            label="Show Watermark"
            horizontal
            tooltip="Add company watermark to invoices"
          >
            <button
              onClick={() => {
                setWatermark(!watermark);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${watermark ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={watermark}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${watermark ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Footer" description="Content shown at the bottom of invoices">
        <SettingField label="Footer Notes" tooltip="Default footer text on all invoices">
          <textarea
            value={footerNotes}
            onChange={(e) => {
              setFooterNotes(e.target.value);
              handleChange();
            }}
            rows={3}
            className="border-border/60 bg-card focus:ring-primary/20 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
          />
        </SettingField>
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
