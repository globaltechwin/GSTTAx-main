"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw } from "lucide-react";

export function GeneralPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [companyName, setCompanyName] = useState("Minsway Solutions Pvt Ltd");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [numberFormat, setNumberFormat] = useState("1,23,456.78");
  const [language, setLanguage] = useState("en");
  const [financialYear, setFinancialYear] = useState("2026-2027");

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection title="Basic Information" description="Core settings for your ERP instance">
        <SettingField label="Company Name" required tooltip="Display name across the application">
          <input
            type="text"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              handleChange();
            }}
            className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
          />
        </SettingField>

        <SettingField label="Time Zone" tooltip="Used for timestamps and scheduling">
          <select
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              handleChange();
            }}
            className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
            <option value="America/New_York">America/New_York (EST, UTC-5)</option>
            <option value="Europe/London">Europe/London (GMT, UTC+0)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST, UTC+10)</option>
          </select>
        </SettingField>
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Locale & Formatting"
        description="Regional preferences for dates, numbers, and language"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="Currency" tooltip="Default currency for invoices">
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound (£)</option>
            </select>
          </SettingField>

          <SettingField label="Date Format" tooltip="Display format for all dates">
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
              <option value="dd-mmm-yyyy">DD-MMM-YYYY</option>
            </select>
          </SettingField>

          <SettingField label="Number Format" tooltip="Display format for large numbers">
            <select
              value={numberFormat}
              onChange={(e) => {
                setNumberFormat(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="1,23,456.78">1,23,456.78 (Indian)</option>
              <option value="123,456.78">123,456.78 (International)</option>
              <option value="123.456,78">123.456,78 (European)</option>
            </select>
          </SettingField>

          <SettingField label="Language" tooltip="Interface language">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
            </select>
          </SettingField>

          <SettingField label="Financial Year" tooltip="Current financial year for reports">
            <select
              value={financialYear}
              onChange={(e) => {
                setFinancialYear(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="2026-2027">2026-2027</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </SettingField>
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
