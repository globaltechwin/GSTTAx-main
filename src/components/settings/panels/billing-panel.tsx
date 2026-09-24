"use client";

import { useState } from "react";
import { SettingSection, SettingField, SettingDivider } from "@/components/settings/setting-field";
import { useSettingsStore } from "@/stores/settings";
import { Save, RotateCcw } from "lucide-react";

export function BillingPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [autoInvoiceNo, setAutoInvoiceNo] = useState(true);
  const [prefix, setPrefix] = useState("INV");
  const [paymentMode, setPaymentMode] = useState("online");
  const [defaultTax, setDefaultTax] = useState("18");
  const [invoiceNotes, setInvoiceNotes] = useState("Thank you for your business!");
  const [autoSaveDraft, setAutoSaveDraft] = useState(true);
  const [roundOff, setRoundOff] = useState(true);
  const [discountBehaviour, setDiscountBehaviour] = useState("percentage");

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection
        title="Invoice Numbering"
        description="Configure how invoice numbers are generated"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField
            label="Auto Generate Invoice Number"
            horizontal
            tooltip="Automatically generate sequential invoice numbers"
          >
            <button
              onClick={() => {
                setAutoInvoiceNo(!autoInvoiceNo);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${autoInvoiceNo ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={autoInvoiceNo}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${autoInvoiceNo ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </SettingField>

          <SettingField label="Invoice Prefix" tooltip="Text prefix before invoice number">
            <input
              type="text"
              value={prefix}
              onChange={(e) => {
                setPrefix(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 font-mono text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Payment & Tax" description="Default payment and tax configuration">
        <div className="grid gap-5 md:grid-cols-2">
          <SettingField
            label="Default Payment Mode"
            tooltip="Pre-selected payment method on new invoices"
          >
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="online">Online Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
              <option value="credit">Credit</option>
            </select>
          </SettingField>

          <SettingField label="Default Tax Rate (%)" tooltip="Default GST rate for new items">
            <select
              value={defaultTax}
              onChange={(e) => {
                setDefaultTax(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="0">0% (Exempt)</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </SettingField>

          <SettingField label="Discount Behaviour" tooltip="How discounts are applied">
            <select
              value={discountBehaviour}
              onChange={(e) => {
                setDiscountBehaviour(e.target.value);
                handleChange();
              }}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
              <option value="both">Allow Both</option>
            </select>
          </SettingField>
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection title="Behaviour" description="Control how billing features work">
        <div className="space-y-4">
          <SettingField label="Invoice Notes" tooltip="Default notes shown on every invoice">
            <textarea
              value={invoiceNotes}
              onChange={(e) => {
                setInvoiceNotes(e.target.value);
                handleChange();
              }}
              rows={2}
              className="border-border/60 bg-card focus:ring-primary/20 w-full resize-none rounded-lg border px-3 py-2 text-sm transition-all focus:ring-2 focus:outline-none"
            />
          </SettingField>

          <SettingField
            label="Auto Save Draft"
            horizontal
            tooltip="Automatically save invoice as draft while editing"
          >
            <button
              onClick={() => {
                setAutoSaveDraft(!autoSaveDraft);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${autoSaveDraft ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={autoSaveDraft}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${autoSaveDraft ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </SettingField>

          <SettingField
            label="Enable Round Off"
            horizontal
            tooltip="Auto round final amount to nearest integer"
          >
            <button
              onClick={() => {
                setRoundOff(!roundOff);
                handleChange();
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${roundOff ? "bg-primary" : "bg-muted"}`}
              role="switch"
              aria-checked={roundOff}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${roundOff ? "translate-x-6" : "translate-x-1"}`}
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
