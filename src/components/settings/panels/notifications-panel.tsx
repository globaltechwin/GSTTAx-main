"use client";

import { useState } from "react";
import { SettingSection, SettingDivider } from "@/components/settings/setting-field";
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

export function NotificationsPanel() {
  const setHasUnsavedChanges = useSettingsStore((s) => s.setHasUnsavedChanges);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [whatsappNotif, setWhatsappNotif] = useState(true);
  const [desktopNotif, setDesktopNotif] = useState(true);
  const [invoiceEmail, setInvoiceEmail] = useState(true);
  const [paymentReminder, setPaymentReminder] = useState(true);
  const [newOrder, setNewOrder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  const handleChange = () => setHasUnsavedChanges(true);

  return (
    <div className="space-y-8">
      <SettingSection
        title="Notification Channels"
        description="Choose how you want to receive notifications"
      >
        <div className="space-y-4">
          <Toggle
            checked={emailNotif}
            onToggle={() => setEmailNotif(!emailNotif)}
            label="Email Notifications"
            description="Receive notifications via email"
            onChange={handleChange}
          />
          <Toggle
            checked={smsNotif}
            onToggle={() => setSmsNotif(!smsNotif)}
            label="SMS Notifications"
            description="Receive notifications via SMS"
            onChange={handleChange}
          />
          <Toggle
            checked={whatsappNotif}
            onToggle={() => setWhatsappNotif(!whatsappNotif)}
            label="WhatsApp Notifications"
            description="Receive notifications on WhatsApp"
            onChange={handleChange}
          />
          <Toggle
            checked={desktopNotif}
            onToggle={() => setDesktopNotif(!desktopNotif)}
            label="Desktop Notifications"
            description="Browser push notifications"
            onChange={handleChange}
          />
        </div>
      </SettingSection>

      <SettingDivider />

      <SettingSection
        title="Notification Events"
        description="Control which events trigger notifications"
      >
        <div className="space-y-4">
          <Toggle
            checked={invoiceEmail}
            onToggle={() => setInvoiceEmail(!invoiceEmail)}
            label="Invoice Sent"
            description="Notify when an invoice is emailed"
            onChange={handleChange}
          />
          <Toggle
            checked={paymentReminder}
            onToggle={() => setPaymentReminder(!paymentReminder)}
            label="Payment Reminders"
            description="Remind for overdue payments"
            onChange={handleChange}
          />
          <Toggle
            checked={newOrder}
            onToggle={() => setNewOrder(!newOrder)}
            label="New Order"
            description="Notify on new order creation"
            onChange={handleChange}
          />
          <Toggle
            checked={weeklyReport}
            onToggle={() => setWeeklyReport(!weeklyReport)}
            label="Weekly Summary"
            description="Receive weekly activity report"
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
