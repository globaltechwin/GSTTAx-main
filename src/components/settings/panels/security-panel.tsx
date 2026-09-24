"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw, Eye, EyeOff } from "lucide-react";

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

export function SecurityPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState("5");
  const [passwordMinLength, setPasswordMinLength] = useState("8");
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecial, setRequireSpecial] = useState(false);

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection title="Change Password" description="Update your account password">
        <div className="space-y-4">
          <SettingField label="Current Password" required>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  handleChange();
                }}
                className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 pr-10 text-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </SettingField>

          <SettingField label="New Password" required>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  handleChange();
                }}
                className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 pr-10 text-sm transition-all focus:ring-2 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </SettingField>

          <SettingField label="Confirm Password" required>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </SettingField>

          <button className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors">
            Update Password
          </button>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Session & Login"
        description="Control session duration and login security"
      >
        <div className="grid gap-5 md:grid-cols-2">
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
              <option value="480">8 hours</option>
            </select>
          </SettingField>

          <SettingField label="Max Login Attempts" tooltip="Lock account after failed attempts">
            <select
              value={loginAttempts}
              onChange={(e) => {
                setLoginAttempts(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="3">3 attempts</option>
              <option value="5">5 attempts</option>
              <option value="10">10 attempts</option>
            </select>
          </SettingField>
        </div>

        <Toggle
          checked={twoFactor}
          onToggle={() => setTwoFactor(!twoFactor)}
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          onChange={handleChange}
        />
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Password Policy" description="Enforce password complexity rules">
        <div className="space-y-4">
          <SettingField label="Minimum Password Length" horizontal>
            <select
              value={passwordMinLength}
              onChange={(e) => {
                setPasswordMinLength(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-28 rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="6">6 characters</option>
              <option value="8">8 characters</option>
              <option value="10">10 characters</option>
              <option value="12">12 characters</option>
            </select>
          </SettingField>

          <Toggle
            checked={requireUppercase}
            onToggle={() => setRequireUppercase(!requireUppercase)}
            label="Require Uppercase Letter"
            description="At least one uppercase letter (A-Z)"
            onChange={handleChange}
          />
          <Toggle
            checked={requireNumber}
            onToggle={() => setRequireNumber(!requireNumber)}
            label="Require Number"
            description="At least one digit (0-9)"
            onChange={handleChange}
          />
          <Toggle
            checked={requireSpecial}
            onToggle={() => setRequireSpecial(!requireSpecial)}
            label="Require Special Character"
            description="At least one special character (!@#$...)"
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
