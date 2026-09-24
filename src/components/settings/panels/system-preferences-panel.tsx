"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw, RefreshCw } from "lucide-react";

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

export function SystemPreferencesPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [defaultPageSize, setDefaultPageSize] = useState("10");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("5");
  const [showAnimations, setShowAnimations] = useState(true);
  const [compactTables, setCompactTables] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection
        title="Display Preferences"
        description="Customize how data is displayed throughout the application"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="Default Date Format" tooltip="Format for displaying dates">
            <select
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="dd/mm/yyyy">DD/MM/YYYY</option>
              <option value="mm/dd/yyyy">MM/DD/YYYY</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD</option>
            </select>
          </SettingField>

          <SettingField label="Time Format" tooltip="12-hour or 24-hour clock">
            <select
              value={timeFormat}
              onChange={(e) => {
                setTimeFormat(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </SettingField>

          <SettingField label="Default Table Page Size" tooltip="Rows per page in tables">
            <select
              value={defaultPageSize}
              onChange={(e) => {
                setDefaultPageSize(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="10">10 rows</option>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
            </select>
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Performance"
        description="Control application behaviour and refresh settings"
      >
        <div className="space-y-4">
          <Toggle
            checked={autoRefresh}
            onToggle={() => setAutoRefresh(!autoRefresh)}
            label="Auto Refresh"
            description="Automatically refresh dashboard data"
            onChange={handleChange}
          />

          {autoRefresh && (
            <SettingField label="Refresh Interval (minutes)" tooltip="How often to refresh data">
              <select
                value={refreshInterval}
                onChange={(e) => {
                  setRefreshInterval(e.target.value);
                  handleChange();
                }}
                className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full max-w-xs rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
              >
                <option value="1">Every 1 minute</option>
                <option value="5">Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
              </select>
            </SettingField>
          )}

          <Toggle
            checked={showAnimations}
            onToggle={() => setShowAnimations(!showAnimations)}
            label="UI Animations"
            description="Enable smooth transitions and animations"
            onChange={handleChange}
          />
          <Toggle
            checked={compactTables}
            onToggle={() => setCompactTables(!compactTables)}
            label="Compact Tables"
            description="Reduce padding in data tables"
            onChange={handleChange}
          />
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Advanced" description="Developer and troubleshooting options">
        <Toggle
          checked={debugMode}
          onToggle={() => setDebugMode(!debugMode)}
          label="Debug Mode"
          description="Enable detailed error logging in browser console"
          onChange={handleChange}
        />

        <button className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20">
          <RefreshCw className="size-4" />
          Clear Application Cache
        </button>
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
