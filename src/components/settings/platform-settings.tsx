"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Settings, Building2, CreditCard, FileText, Receipt, Bell, Printer, Users,
  Shield, HardDrive, Palette, Link2, SlidersHorizontal, Search, Save, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/session-provider";

type Section =
  | "general" | "company" | "billing" | "invoice" | "gst-tax" | "notifications"
  | "printing" | "users-roles" | "security" | "backup-restore" | "appearance"
  | "integrations" | "system-preferences";
type Field = { key: string; label: string; type?: "text" | "number" | "select" | "textarea" | "toggle"; defaultValue: string; options?: { label: string; value: string }[]; help?: string; placeholder?: string };
type SettingsValues = Record<string, string>;
type SettingsBySection = Partial<Record<Section, SettingsValues>>;

const categories: { key: Section; label: string; icon: typeof Settings; description: string; fields: Field[] }[] = [
  { key: "general", label: "General", icon: Settings, description: "Regional and general workspace preferences.", fields: [
    { key: "companyName", label: "Display name", defaultValue: "", placeholder: "Enter display name", help: "Name shown in the application where supported." },
    { key: "timezone", label: "Time zone", type: "select", defaultValue: "Asia/Kolkata", options: [{ label: "India Standard Time (Asia/Kolkata)", value: "Asia/Kolkata" }, { label: "UTC", value: "UTC" }, { label: "London (Europe/London)", value: "Europe/London" }, { label: "New York (America/New_York)", value: "America/New_York" }] },
    { key: "currency", label: "Currency", type: "select", defaultValue: "INR", options: [{ label: "INR — Indian Rupee (₹)", value: "INR" }, { label: "USD — US Dollar ($)", value: "USD" }, { label: "EUR — Euro (€)", value: "EUR" }, { label: "GBP — British Pound (£)", value: "GBP" }] },
    { key: "dateFormat", label: "Date format", type: "select", defaultValue: "DD/MM/YYYY", options: [{ label: "DD/MM/YYYY", value: "DD/MM/YYYY" }, { label: "MM/DD/YYYY", value: "MM/DD/YYYY" }, { label: "YYYY-MM-DD", value: "YYYY-MM-DD" }] },
    { key: "numberFormat", label: "Number format", type: "select", defaultValue: "indian", options: [{ label: "Indian (1,23,456.78)", value: "indian" }, { label: "International (123,456.78)", value: "international" }] },
    { key: "language", label: "Language", type: "select", defaultValue: "en", options: [{ label: "English", value: "en" }, { label: "Tamil", value: "ta" }, { label: "Hindi", value: "hi" }] },
    { key: "financialYear", label: "Financial year", type: "select", defaultValue: "2026-2027", options: [{ label: "2026–2027", value: "2026-2027" }, { label: "2025–2026", value: "2025-2026" }, { label: "2024–2025", value: "2024-2025" }] },
  ]},
  { key: "company", label: "Company", icon: Building2, description: "Business identity details for the selected settings scope.", fields: [
    { key: "legalName", label: "Legal business name", defaultValue: "" }, { key: "gstin", label: "GSTIN", defaultValue: "" },
    { key: "email", label: "Business email", defaultValue: "" }, { key: "phone", label: "Business phone", defaultValue: "" },
    { key: "address", label: "Business address", type: "textarea", defaultValue: "" },
  ]},
  { key: "billing", label: "Billing", icon: CreditCard, description: "Defaults for billing workflows. Review their effect on existing billing flows before applying platform-wide changes.", fields: [
    { key: "paymentTermsDays", label: "Default payment terms (days)", type: "number", defaultValue: "30" },
    { key: "roundingMode", label: "Rounding mode", type: "select", defaultValue: "standard", options: [{ label: "Standard rounding", value: "standard" }, { label: "Round down", value: "down" }, { label: "Round up", value: "up" }] },
    { key: "defaultNotes", label: "Default billing note", type: "textarea", defaultValue: "" },
  ]},
  { key: "invoice", label: "Document Numbering", icon: FileText, description: "Configure separate numbering formats and permissions for Invoice, Proforma Invoice, Delivery Challan and Purchase Order for every user in this Admin workspace.", fields: [
    { key: "invoiceNumberEnabled", label: "Automatic invoice numbering", type: "toggle", defaultValue: "true", help: "When disabled, users must enter invoice numbers manually." },
    { key: "invoiceNumberPrefix", label: "Invoice prefix", defaultValue: "IN", help: "Example: IN, INV or GST." },
    { key: "invoiceNumberFormat", label: "Number format", defaultValue: "{prefix}-{number}/{FY}", help: "Use {prefix}, {number} and {FY}. Example: {prefix}-{number}/{FY}. Keep the full format within 50 characters." },
    { key: "invoiceNumberStart", label: "Starting number", type: "number", defaultValue: "1", help: "Used when a new financial year begins." },
    { key: "invoiceNumberPadding", label: "Number padding (digits)", type: "select", defaultValue: "2", options: [{ label: "1 digit (1)", value: "1" }, { label: "2 digits (01)", value: "2" }, { label: "3 digits (001)", value: "3" }, { label: "4 digits (0001)", value: "4" }, { label: "5 digits (00001)", value: "5" }, { label: "6 digits (000001)", value: "6" }] },
    { key: "invoiceAllowManualOverride", label: "Allow users to override invoice numbers", type: "toggle", defaultValue: "false", help: "If enabled, users can enter a custom number while creating a new invoice. Existing invoices remain unchanged." },
    { key: "proformaNumberEnabled", label: "Proforma: Automatic numbering", type: "toggle", defaultValue: "true", help: "When disabled, users must enter Proforma numbers manually." },
    { key: "proformaNumberPrefix", label: "Proforma: Prefix", defaultValue: "PI" },
    { key: "proformaNumberFormat", label: "Proforma: Number format", defaultValue: "{prefix}-{number}/{FY}", help: "Tokens: {prefix}, {number}, {FY}." },
    { key: "proformaNumberStart", label: "Proforma: Starting number", type: "number", defaultValue: "1" },
    { key: "proformaNumberPadding", label: "Proforma: Number padding", type: "select", defaultValue: "3", options: [{ label: "1 digit", value: "1" }, { label: "2 digits", value: "2" }, { label: "3 digits", value: "3" }, { label: "4 digits", value: "4" }, { label: "5 digits", value: "5" }, { label: "6 digits", value: "6" }] },
    { key: "proformaAllowManualOverride", label: "Proforma: Allow user override", type: "toggle", defaultValue: "false" },
    { key: "deliveryChallanNumberEnabled", label: "Delivery Challan: Automatic numbering", type: "toggle", defaultValue: "true" },
    { key: "deliveryChallanNumberPrefix", label: "Delivery Challan: Prefix", defaultValue: "DC" },
    { key: "deliveryChallanNumberFormat", label: "Delivery Challan: Number format", defaultValue: "{prefix}-{number}/{FY}", help: "Tokens: {prefix}, {number}, {FY}." },
    { key: "deliveryChallanNumberStart", label: "Delivery Challan: Starting number", type: "number", defaultValue: "1" },
    { key: "deliveryChallanNumberPadding", label: "Delivery Challan: Number padding", type: "select", defaultValue: "3", options: [{ label: "1 digit", value: "1" }, { label: "2 digits", value: "2" }, { label: "3 digits", value: "3" }, { label: "4 digits", value: "4" }, { label: "5 digits", value: "5" }, { label: "6 digits", value: "6" }] },
    { key: "deliveryChallanAllowManualOverride", label: "Delivery Challan: Allow user override", type: "toggle", defaultValue: "false" },
    { key: "purchaseOrderNumberEnabled", label: "Purchase Order: Automatic numbering", type: "toggle", defaultValue: "true" },
    { key: "purchaseOrderNumberPrefix", label: "Purchase Order: Prefix", defaultValue: "PO" },
    { key: "purchaseOrderNumberFormat", label: "Purchase Order: Number format", defaultValue: "{prefix}-{number}/{FY}", help: "Tokens: {prefix}, {number}, {FY}." },
    { key: "purchaseOrderNumberStart", label: "Purchase Order: Starting number", type: "number", defaultValue: "1" },
    { key: "purchaseOrderNumberPadding", label: "Purchase Order: Number padding", type: "select", defaultValue: "3", options: [{ label: "1 digit", value: "1" }, { label: "2 digits", value: "2" }, { label: "3 digits", value: "3" }, { label: "4 digits", value: "4" }, { label: "5 digits", value: "5" }, { label: "6 digits", value: "6" }] },
    { key: "purchaseOrderAllowManualOverride", label: "Purchase Order: Allow user override", type: "toggle", defaultValue: "false" },
    { key: "invoicePrefix", label: "Legacy invoice prefix (other templates)", defaultValue: "INV-" },
    { key: "invoiceTerms", label: "Default invoice terms", type: "textarea", defaultValue: "" },
    { key: "invoiceFooter", label: "Invoice footer", type: "textarea", defaultValue: "" },
    { key: "showDueDate", label: "Show due date by default", type: "toggle", defaultValue: "true" },
  ]},
  { key: "gst-tax", label: "GST & Tax", icon: Receipt, description: "Default tax preferences. Transaction tax calculations remain subject to the invoice validation logic.", fields: [
    { key: "defaultGstRate", label: "Default GST rate (%)", type: "select", defaultValue: "18", options: ["0", "5", "12", "18", "28"].map((v) => ({ label: `${v}%`, value: v })) },
    { key: "defaultTaxType", label: "Default tax type", type: "select", defaultValue: "intra-state", options: [{ label: "Intra-state (CGST + SGST)", value: "intra-state" }, { label: "Inter-state (IGST)", value: "inter-state" }] },
    { key: "reverseCharge", label: "Reverse charge default", type: "toggle", defaultValue: "false" },
    { key: "defaultHsnSac", label: "Default HSN/SAC", defaultValue: "" },
  ]},
  { key: "notifications", label: "Notifications", icon: Bell, description: "Notification preferences. Email delivery requires a separately configured provider.", fields: [
    { key: "inAppNotifications", label: "In-app notifications", type: "toggle", defaultValue: "true" },
    { key: "emailNotifications", label: "Email notification preference", type: "toggle", defaultValue: "false", help: "This preference does not configure an email provider." },
  ]},
  { key: "printing", label: "Printing", icon: Printer, description: "Default print preferences for supported invoice print views.", fields: [
    { key: "paperSize", label: "Paper size", type: "select", defaultValue: "A4", options: [{ label: "A4", value: "A4" }, { label: "A5", value: "A5" }] },
    { key: "orientation", label: "Orientation", type: "select", defaultValue: "portrait", options: [{ label: "Portrait", value: "portrait" }, { label: "Landscape", value: "landscape" }] },
    { key: "marginsMm", label: "Margins (mm)", type: "number", defaultValue: "8" },
    { key: "showLogo", label: "Show company logo", type: "toggle", defaultValue: "true" },
    { key: "printFooter", label: "Print footer text", type: "textarea", defaultValue: "" },
  ]},
  { key: "users-roles", label: "Users & Roles", icon: Users, description: "Default onboarding preferences only. Actual access is controlled by the existing role and module permission system.", fields: [
    { key: "newUserStatus", label: "New user status", type: "select", defaultValue: "active", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] },
    { key: "defaultUserModuleAccess", label: "Default module access preset", type: "select", defaultValue: "minimal", options: [{ label: "Minimal access", value: "minimal" }, { label: "Admin-assigned access", value: "admin-assigned" }] },
  ]},
  { key: "security", label: "Security", icon: Shield, description: "Saved policy preferences. Security enforcement remains governed by the application's server-side authentication configuration.", fields: [
    { key: "minimumPasswordLength", label: "Minimum password length preference", type: "number", defaultValue: "4" },
    { key: "sessionTimeoutMinutes", label: "Session timeout preference (minutes)", type: "number", defaultValue: "60" },
    { key: "maxLoginAttempts", label: "Maximum login attempts preference", type: "number", defaultValue: "5" },
  ]},
  { key: "backup-restore", label: "Backup & Restore", icon: HardDrive, description: "Backup policy preferences. Actual backup and restore operations are available through the dedicated backup workflow.", fields: [
    { key: "retentionDays", label: "Retention preference (days)", type: "number", defaultValue: "30" },
    { key: "backupFrequency", label: "Preferred backup frequency", type: "select", defaultValue: "manual", options: [{ label: "Manual", value: "manual" }, { label: "Daily (requires scheduler setup)", value: "daily" }, { label: "Weekly (requires scheduler setup)", value: "weekly" }] },
  ]},
  { key: "appearance", label: "Appearance", icon: Palette, description: "Display preferences saved for this settings scope.", fields: [
    { key: "theme", label: "Theme preference", type: "select", defaultValue: "system", options: [{ label: "System", value: "system" }, { label: "Light", value: "light" }, { label: "Dark", value: "dark" }] },
    { key: "compactTables", label: "Compact tables preference", type: "toggle", defaultValue: "false" },
  ]},
  { key: "integrations", label: "Integrations", icon: Link2, description: "Integration preferences only. Provider credentials and connection tests must be configured separately and securely.", fields: [
    { key: "preferredProvider", label: "Preferred integration provider", type: "select", defaultValue: "none", options: [{ label: "None", value: "none" }, { label: "Razorpay", value: "razorpay" }, { label: "SMTP email", value: "smtp" }] },
    { key: "integrationEnabled", label: "Enable selected integration preference", type: "toggle", defaultValue: "false" },
  ]},
  { key: "system-preferences", label: "System Preferences", icon: SlidersHorizontal, description: "Default display preferences saved in the settings database.", fields: [
    { key: "defaultPageSize", label: "Default table page size", type: "select", defaultValue: "10", options: [{ label: "10 rows", value: "10" }, { label: "25 rows", value: "25" }, { label: "50 rows", value: "50" }] },
    { key: "confirmDestructiveActions", label: "Require confirmation for destructive actions", type: "toggle", defaultValue: "true" },
  ]},
];

function defaultsFor(section: Section): SettingsValues {
  return Object.fromEntries(categories.find((category) => category.key === section)!.fields.map((field) => [field.key, field.defaultValue]));
}

function previewDocumentNumber(values: SettingsValues, prefix: string, formatKey: string) {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 3 ? year : year - 1;
  const fy = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
  const format = values[formatKey] || "{prefix}-{number}/{FY}";
  return format.replaceAll("{prefix}", prefix).replaceAll("{number}", "1").replaceAll("{FY}", fy);
}

export function PlatformSettings({ scope = "platform" }: { scope?: "platform" | "workspace" }) {
  const { user } = useSession();
  const endpoint = scope === "platform" ? "/api/superadmin/settings" : "/api/settings";
  const canSave = scope === "platform" ? user?.role === "SUPERADMIN" : user?.role === "ADMIN";
  const [section, setSection] = useState<Section>("general");
  const [settings, setSettings] = useState<SettingsBySection>({});
  const [original, setOriginal] = useState<SettingsBySection>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const values = settings[section] ?? defaultsFor(section);
  const activeCategory = categories.find((category) => category.key === section)!;
  const numberingKeys = /^(invoice|proforma|deliveryChallan|purchaseOrder)(Number|AllowManual)/;
  const visibleFields = section === "invoice"
    ? activeCategory.fields.filter((field) => !numberingKeys.test(field.key))
    : activeCategory.fields;
  const filteredCategories = useMemo(() => categories.filter((category) => (scope !== "workspace" || user?.role === "ADMIN" || category.key !== "invoice") && category.label.toLowerCase().includes(search.toLowerCase())), [search, scope, user?.role]);

  const loadSettings = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(result && typeof result === "object" && "error" in result ? String(result.error) : "Unable to load settings");
      const parsed: SettingsBySection = {};
      for (const category of categories) {
        const entry = result && typeof result === "object" ? (result as Record<string, unknown>)[category.key] : undefined;
        const entryValue = entry && typeof entry === "object" && "value" in entry ? (entry as { value: unknown }).value : undefined;
        const defaults = defaultsFor(category.key);
        if (entryValue && typeof entryValue === "object" && !Array.isArray(entryValue)) {
          for (const [key, value] of Object.entries(entryValue)) {
            if ((typeof value === "string" || typeof value === "number" || typeof value === "boolean") && Object.hasOwn(defaults, key)) defaults[key] = String(value);
          }
        }
        parsed[category.key] = defaults;
      }
      setSettings(parsed); setOriginal(JSON.parse(JSON.stringify(parsed)) as SettingsBySection);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load settings");
    } finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  const updateValue = (key: string, value: string) => {
    setSettings((current) => ({ ...current, [section]: { ...(current[section] ?? defaultsFor(section)), [key]: value } }));
    setNotice(null);
  };

  const saveSettings = async () => {
    if (!canSave) { setError("You do not have permission to save these settings."); return; }
    setSaving(true); setError(null); setNotice(null);
    try {
      const valuesToSave = scope === "platform" && section === "invoice"
        ? Object.fromEntries(Object.entries(values).filter(([key]) => !/^(invoice|proforma|deliveryChallan|purchaseOrder)(Number|AllowManual)/.test(key)))
        : values;
      const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, values: valuesToSave }) });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(result && typeof result === "object" && "error" in result ? String(result.error) : "Unable to save settings");
      setOriginal((current) => ({ ...current, [section]: { ...values } }));
      setNotice(`${activeCategory.label} settings saved successfully.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings");
    } finally { setSaving(false); }
  };

  const resetSection = () => {
    setSettings((current) => ({ ...current, [section]: { ...(original[section] ?? defaultsFor(section)) } }));
    setError(null); setNotice("Unsaved changes were discarded.");
  };

  return (
    <div className="space-y-6">
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm"><a href={scope === "platform" ? "/superadmin" : "/dashboard"} className="hover:text-foreground">Dashboard</a><span>›</span><span className="text-foreground font-medium">Settings</span></nav>
      <div className="flex items-center gap-3"><div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl"><Settings className="text-primary size-5" /></div><div><h1 className="text-foreground text-xl font-bold tracking-tight">{scope === "platform" ? "Platform settings" : "Settings"}</h1><p className="text-muted-foreground mt-0.5 text-sm">{scope === "platform" ? "Configure platform-wide defaults without changing individual workspace settings." : "Configure preferences for your Admin workspace."}</p></div></div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="border-border/60 bg-card h-fit w-full shrink-0 rounded-xl border p-2 lg:w-64">
          <div className="relative mb-2 px-1"><Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" /><input aria-label="Search settings" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search settings..." className="border-border/60 bg-background h-9 w-full rounded-lg border pr-3 pl-9 text-sm" /></div>
          <nav className="space-y-0.5">{filteredCategories.map((category) => { const Icon = category.icon; return <button key={category.key} type="button" onClick={() => { setSection(category.key); setError(null); setNotice(null); }} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors", section === category.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}><Icon className="size-4 shrink-0" /><span className="truncate">{category.label}</span></button>; })}</nav>
        </aside>
        <section className="border-border/60 bg-card min-w-0 flex-1 rounded-2xl border p-5 shadow-sm sm:p-6">
          <div className="border-border/60 mb-6 flex items-start gap-3 border-b pb-4"><div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg"><activeCategory.icon className="text-primary size-4" /></div><div><h2 className="text-foreground text-lg font-semibold">{activeCategory.label}</h2><p className="text-muted-foreground mt-1 text-xs">{activeCategory.description}</p></div></div>
          {error && <p className="text-destructive mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm" role="alert">{error}</p>}
          {notice && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{notice}</p>}
          {loading ? <p className="text-muted-foreground py-6 text-sm">Loading saved settings...</p> : <>{section === "invoice" && scope === "workspace" && <div className="mb-6 space-y-5">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4"><h3 className="font-semibold text-sm">Custom billing number formats</h3><p className="text-muted-foreground mt-1 text-xs">Build any format using your own text and the available tokens. The running number starts at 1. Changing the format keeps the existing sequence and never changes old documents.</p></div>
            {([
              { id: "invoice", label: "Tax Invoice", key: "invoiceNumberFormat", prefix: "IN" },
              { id: "proforma", label: "Proforma Invoice", key: "proformaNumberFormat", prefix: "PI" },
              { id: "deliveryChallan", label: "Delivery Challan", key: "deliveryChallanNumberFormat", prefix: "DC" },
              { id: "purchaseOrder", label: "Purchase Order", key: "purchaseOrderNumberFormat", prefix: "PO" },
            ] as const).map((item) => <div key={item.id} className="rounded-xl border border-border/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold text-sm">{item.label}</h4><span className="text-xs text-muted-foreground">Independent sequence · starts at 1</span></div>
              <label className="block text-xs font-medium" htmlFor={`format-${item.id}`}>Number format</label>
              <input id={`format-${item.id}`} value={values[item.key] ?? "{prefix}-{number}/{FY}"} onChange={(event) => updateValue(item.key, event.target.value)} maxLength={50} placeholder="Example: IN-{number}/{FY}" className="border-border/60 bg-background h-10 w-full rounded-lg border px-3 font-mono text-sm" />
              <div className="flex flex-wrap gap-2">{["{number}", "{FY}", "{prefix}"].map((token) => <button key={token} type="button" onClick={() => updateValue(item.key, `${values[item.key] ?? ""}${token}`)} className="rounded-md border border-border px-2.5 py-1 text-xs font-mono hover:bg-muted">+ {token}</button>)}</div>
              <p className="text-muted-foreground text-xs">{`{number}`} is required. `{`{FY}`} is optional and inserts the Indian financial year (e.g. 26-27). `{`{prefix}`} is optional; you can also type your own prefix directly. Use any separators or text.</p>
              <div className="rounded-lg bg-primary/5 px-3 py-2"><span className="text-muted-foreground text-xs">Live preview (next number)</span><p className="text-primary mt-1 font-mono text-lg font-bold">{previewDocumentNumber(values, item.prefix, item.key)}</p></div>
            </div>)}
          </div>}<div className="grid gap-x-5 gap-y-5 md:grid-cols-2">{visibleFields.map((field) => <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}><label htmlFor={`setting-${field.key}`} className="text-foreground mb-2 block text-sm font-medium">{field.label}</label>{field.type === "select" ? <select id={`setting-${field.key}`} value={values[field.key] ?? field.defaultValue} onChange={(event) => updateValue(field.key, event.target.value)} className="border-border/60 bg-background focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "toggle" ? <label className="flex min-h-10 items-center gap-3"><input id={`setting-${field.key}`} type="checkbox" checked={(values[field.key] ?? field.defaultValue) === "true"} onChange={(event) => updateValue(field.key, String(event.target.checked))} className="size-4 accent-blue-700" /><span className="text-muted-foreground text-sm">{(values[field.key] ?? field.defaultValue) === "true" ? "Enabled" : "Disabled"}</span></label> : field.type === "textarea" ? <textarea id={`setting-${field.key}`} value={values[field.key] ?? field.defaultValue} onChange={(event) => updateValue(field.key, event.target.value)} rows={3} maxLength={5000} placeholder={field.placeholder} className="border-border/60 bg-background focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none" /> : <input id={`setting-${field.key}`} type={field.type === "number" ? "number" : "text"} min={field.type === "number" ? "0" : undefined} value={values[field.key] ?? field.defaultValue} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} className="border-border/60 bg-background focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none" />}{field.help && <p className="text-muted-foreground mt-1 text-xs">{field.help}</p>}</div>)}</div></>}

          <div className="border-border/60 mt-7 flex flex-wrap justify-end gap-3 border-t pt-5"><button type="button" onClick={resetSection} disabled={loading || saving} className="border-border/60 text-muted-foreground hover:bg-muted/50 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50"><RotateCcw className="size-4" />Discard changes</button><button type="button" onClick={saveSettings} disabled={loading || saving || !canSave} className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold shadow-sm disabled:opacity-50"><Save className="size-4" />{saving ? "Saving..." : "Save Changes"}</button></div>
        </section>
      </div>
    </div>
  );
}
