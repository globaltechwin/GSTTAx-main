"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw, Shield, Eye, Trash2 } from "lucide-react";

interface UserRole {
  id: number;
  name: string;
  permissions: string[];
  userCount: number;
}

const roles: UserRole[] = [
  { id: 1, name: "Administrator", permissions: ["all"], userCount: 1 },
  { id: 2, name: "Accountant", permissions: ["invoices", "reports", "billing"], userCount: 2 },
  { id: 3, name: "Sales Executive", permissions: ["invoices", "companies"], userCount: 3 },
];

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

export function UsersRolesPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [maxUsers, setMaxUsers] = useState("10");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [allowSignup, setAllowSignup] = useState(false);

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection title="User Limits" description="Control user access and session settings">
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="Maximum Users" tooltip="Maximum number of user accounts">
            <select
              value={maxUsers}
              onChange={(e) => {
                setMaxUsers(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="5">5 users</option>
              <option value="10">10 users</option>
              <option value="25">25 users</option>
              <option value="50">50 users</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </SettingField>

          <SettingField label="Session Timeout (minutes)" tooltip="Auto logout after inactivity">
            <select
              value={sessionTimeout}
              onChange={(e) => {
                setSessionTimeout(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </SettingField>
        </div>

        <Toggle
          checked={allowSignup}
          onToggle={() => setAllowSignup(!allowSignup)}
          label="Allow Self Sign-Up"
          description="Allow new users to register accounts"
          onChange={handleChange}
        />
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Roles & Permissions"
        description="Manage roles and their access levels"
      >
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="border-border/60 bg-card flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl">
                  <Shield className="text-primary size-5" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-semibold">{role.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {role.userCount} user{role.userCount !== 1 ? "s" : ""} ·{" "}
                    {role.permissions.includes("all")
                      ? "Full access"
                      : `${role.permissions.length} permissions`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/20"
                  title="Edit role"
                >
                  <Pencil className="size-3" /> Edit
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20"
                  title="View permissions"
                >
                  <Eye className="size-3" /> View
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20"
                  title="Delete role"
                >
                  <Trash2 className="size-3" /> Delete
                </button>
              </div>
            </div>
          ))}
          <button className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus className="size-4" /> Add Role
          </button>
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

import { Pencil, Plus } from "lucide-react";
