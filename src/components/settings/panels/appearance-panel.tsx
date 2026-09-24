"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw, Sun, Moon, Monitor } from "lucide-react";

export function AppearancePanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [sidebarStyle, setSidebarStyle] = useState("dark");
  const [accentColor, setAccentColor] = useState("#4f46e5");
  const [compactMode, setCompactMode] = useState(false);

  const handleChange = () => setHasUnsavedChanges(true);

  const accentColors = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Blue", value: "#2563eb" },
    { name: "Violet", value: "#7c3aed" },
    { name: "Rose", value: "#e11d48" },
    { name: "Emerald", value: "#059669" },
    { name: "Amber", value: "#d97706" },
  ];

  return (
    <div className="space-y-8">
      <SettingSection title="Theme" description="Choose your preferred color theme">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "light" as const,
              label: "Light Mode",
              icon: Sun,
              desc: "Bright and clean interface",
            },
            { value: "dark" as const, label: "Dark Mode", icon: Moon, desc: "Easy on the eyes" },
            {
              value: "system" as const,
              label: "System",
              icon: Monitor,
              desc: "Follow OS preference",
            },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTheme(opt.value);
                handleChange();
              }}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                theme === opt.value
                  ? "border-primary bg-primary/5 shadow-primary/10 shadow-sm"
                  : "border-border/60 hover:border-border hover:bg-muted/30"
              }`}
            >
              <opt.icon
                className={`size-6 ${theme === opt.value ? "text-primary" : "text-muted-foreground"}`}
              />
              <div className="text-center">
                <p
                  className={`text-sm font-semibold ${theme === opt.value ? "text-primary" : "text-foreground"}`}
                >
                  {opt.label}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Accent Color" description="Choose your brand accent color">
        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                setAccentColor(color.value);
                handleChange();
              }}
              className={`group flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 transition-all ${
                accentColor === color.value
                  ? "border-foreground shadow-sm"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <span
                className="ring-offset-background size-5 rounded-full ring-2 ring-white ring-offset-2"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm font-medium">{color.name}</span>
            </button>
          ))}
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Sidebar" description="Customize sidebar appearance">
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="Sidebar Style" tooltip="Visual style of the navigation sidebar">
            <select
              value={sidebarStyle}
              onChange={(e) => {
                setSidebarStyle(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="glass">Glassmorphism</option>
            </select>
          </SettingField>

          <SettingField label="Compact Mode" horizontal tooltip="Reduce sidebar width and padding">
            <button
              onClick={() => {
                setCompactMode(!compactMode);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${compactMode ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={compactMode}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${compactMode ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
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
