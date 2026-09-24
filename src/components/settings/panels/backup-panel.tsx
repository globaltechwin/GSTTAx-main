"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Cloud,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";

export function BackupPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [retentionDays, setRetentionDays] = useState("30");

  const handleChange = () => setHasUnsavedChanges(true);

  const backupHistory = [
    { id: 1, date: "2026-08-03 23:00", type: "Auto", status: "success", size: "2.4 MB" },
    { id: 2, date: "2026-08-02 23:00", type: "Auto", status: "success", size: "2.3 MB" },
    { id: 3, date: "2026-08-01 14:32", type: "Manual", status: "success", size: "2.3 MB" },
    { id: 4, date: "2026-07-31 23:00", type: "Auto", status: "failed", size: "—" },
  ];

  return (
    <div className="space-y-8">
      <SettingSection title="Backup Options" description="Configure automatic backup settings">
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField
            label="Automatic Backup"
            horizontal
            tooltip="Automatically backup data on schedule"
          >
            <button
              onClick={() => {
                setAutoBackup(!autoBackup);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${autoBackup ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={autoBackup}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${autoBackup ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </SettingField>

          <SettingField label="Backup Frequency" tooltip="How often to create backups">
            <select
              value={backupFrequency}
              onChange={(e) => {
                setBackupFrequency(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </SettingField>

          <SettingField
            label="Retention Period (days)"
            tooltip="Auto-delete backups older than this"
          >
            <select
              value={retentionDays}
              onChange={(e) => {
                setRetentionDays(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Backup Actions" description="Manual backup and restore operations">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button className="border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 flex items-center gap-3 rounded-xl border p-4 text-left transition-all">
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
              <HardDrive className="text-primary size-5" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Local Backup</p>
              <p className="text-muted-foreground text-xs">Download to your device</p>
            </div>
          </button>

          <button className="border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 flex items-center gap-3 rounded-xl border p-4 text-left transition-all">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Cloud className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Cloud Backup</p>
              <p className="text-muted-foreground text-xs">Sync to cloud storage</p>
            </div>
          </button>

          <button className="border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 flex items-center gap-3 rounded-xl border p-4 text-left transition-all">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Upload className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-foreground text-sm font-semibold">Restore Backup</p>
              <p className="text-muted-foreground text-xs">Import from backup file</p>
            </div>
          </button>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Backup History" description="Recent backup activity">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-border/60 bg-muted/40 border-b">
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
                  Date & Time
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
                  Type
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
                  Status
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
                  Size
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {backupHistory.map((b) => (
                <tr key={b.id} className="border-border/40 border-b last:border-0">
                  <td className="px-4 py-3 text-sm">{b.date}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${b.type === "Manual" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"}`}
                    >
                      {b.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {b.status === "success" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="size-3" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="size-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-sm">{b.size}</td>
                  <td className="px-4 py-3">
                    {b.status === "success" && (
                      <button className="text-primary hover:text-primary/80 text-xs font-medium transition-colors">
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
