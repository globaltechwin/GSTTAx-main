"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw, Upload } from "lucide-react";

export function CompanyPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [companyName, setCompanyName] = useState("Minsway Solutions Pvt Ltd");
  const [address, setAddress] = useState("123 Business Park, Chennai, Tamil Nadu - 600001");
  const [gstNo, setGstNo] = useState("33AABCM1234N1Z5");
  const [panNo, setPanNo] = useState("AABCM1234N");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("info@minsway.com");
  const [website, setWebsite] = useState("https://minsway.com");

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection title="Company Logo" description="Upload and manage your company branding">
        <div className="flex items-center gap-6">
          <div className="border-border/60 bg-muted/30 flex size-24 items-center justify-center rounded-2xl border-2 border-dashed">
            <span className="text-muted-foreground text-2xl font-bold">MS</span>
          </div>
          <div className="space-y-2">
            <button className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors">
              <Upload className="size-4" />
              Upload Logo
            </button>
            <p className="text-muted-foreground text-xs">
              PNG, JPG up to 2MB. Recommended 200x200px.
            </p>
          </div>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Company Details"
        description="Official company information for invoices and documents"
      >
        <SettingField label="Company Name" required>
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

        <SettingField label="Address">
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              handleChange();
            }}
            rows={3}
            className="border-border/60 bg-card focus:ring-primary/20 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
          />
        </SettingField>

        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="GST Number" tooltip="15-digit GSTIN">
            <input
              type="text"
              value={gstNo}
              onChange={(e) => {
                setGstNo(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 font-mono text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </SettingField>

          <SettingField label="PAN Number" tooltip="10-digit PAN">
            <input
              type="text"
              value={panNo}
              onChange={(e) => {
                setPanNo(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 font-mono text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Contact Details" description="How customers and vendors reach you">
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField label="Phone Number">
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </SettingField>

          <SettingField label="Email Address">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </SettingField>

          <SettingField label="Website">
            <input
              type="url"
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            />
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
