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

export function PrintingPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [fontSize, setFontSize] = useState("10");
  const [autoPrint, setAutoPrint] = useState(false);
  const [copies, setCopies] = useState("1");

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection title="Page Setup" description="Configure paper size and layout for printing">
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="Paper Size" tooltip="Standard paper size">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="A4">A4 (210 x 297 mm)</option>
              <option value="A5">A5 (148 x 210 mm)</option>
              <option value="Letter">Letter (8.5 x 11 in)</option>
              <option value="Legal">Legal (8.5 x 14 in)</option>
            </select>
          </SettingField>

          <SettingField label="Orientation" tooltip="Page orientation">
            <select
              value={orientation}
              onChange={(e) => {
                setOrientation(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </SettingField>

          <SettingField label="Font Size" tooltip="Base font size for printed documents">
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="8">8px</option>
              <option value="9">9px</option>
              <option value="10">10px</option>
              <option value="11">11px</option>
              <option value="12">12px</option>
            </select>
          </SettingField>

          <SettingField label="Default Copies" tooltip="Number of copies to print">
            <select
              value={copies}
              onChange={(e) => {
                setCopies(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="1">1 copy</option>
              <option value="2">2 copies</option>
              <option value="3">3 copies</option>
            </select>
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Print Elements"
        description="Control what appears on printed documents"
      >
        <div className="space-y-4">
          <Toggle
            checked={showHeader}
            onToggle={() => setShowHeader(!showHeader)}
            label="Show Header"
            description="Include company header on printed pages"
            onChange={handleChange}
          />
          <Toggle
            checked={showFooter}
            onToggle={() => setShowFooter(!showFooter)}
            label="Show Footer"
            description="Include page footer and notes"
            onChange={handleChange}
          />
          <Toggle
            checked={showBorders}
            onToggle={() => setShowBorders(!showBorders)}
            label="Show Borders"
            description="Draw table borders on printed invoices"
            onChange={handleChange}
          />
          <Toggle
            checked={autoPrint}
            onToggle={() => setAutoPrint(!autoPrint)}
            label="Auto Print"
            description="Automatically open print dialog after saving"
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
