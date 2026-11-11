"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormData } from "@/lib/validations";
import { MODULE_KEYS, PERMISSION_ACTIONS, defaultActionPermissions, parseActionPermissions, type ActionPermissions, type PermissionAction } from "@/lib/permissions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  companies: "Company",
  "to-companies": "To Company (Sales)",
  invoices: "Invoice",
  "proforma-invoices": "Proforma Invoice",
  "delivery-challans": "Delivery Challan",
  purchases: "Purchased Invoice",
  vendors: "Vendor Details (Purchasing From)",
  "purchase-orders": "Purchase Order",
  "turnover-report": "Turnover Report",
  referrals: "Referral",
  "import-export": "Import/Export",
  users: "Users",
  settings: "Settings",
};
const SIDEBAR_ITEMS = MODULE_KEYS.map((key) => ({ key, label: MODULE_LABELS[key] ?? key }));

interface UserFormProps {
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    sidebarAccess: string[];
    actionPermissions?: ActionPermissions;
  };
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  availableModules?: string[];
}

export function UserForm({ user, onSubmit, onCancel, isLoading, availableModules = [...MODULE_KEYS] }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    setError,
    control,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      username: user?.username ?? "",
      password: "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      role: "user",
      status: (user?.status as "active" | "inactive") ?? "active",
      sidebarAccess: user?.sidebarAccess ?? [],
    },
  });
  const selectedAccess = useWatch({ control, name: "sidebarAccess" }) ?? [];
  const [actions, setActions] = useState<ActionPermissions>(parseActionPermissions(user?.actionPermissions, user?.sidebarAccess ?? []));
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        password: "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: "user",
        status: user.status as "active" | "inactive",
        sidebarAccess: user.sidebarAccess,
      });
      setActions(parseActionPermissions(user.actionPermissions, user.sidebarAccess));
    } else { setActions({}); }
  }, [user, reset]);

  const toggleAccess = (key: string) => {
    const next = selectedAccess.includes(key)
      ? selectedAccess.filter((item) => item !== key)
      : [...selectedAccess, key];
    setValue("sidebarAccess", next, { shouldDirty: true, shouldValidate: true });
    setActions((current) => {
      const updated = { ...current };
      if (next.includes(key)) updated[key as keyof ActionPermissions] = { view: true };
      else delete updated[key as keyof ActionPermissions];
      return updated;
    });
  };

  const toggleAction = (module: string, action: PermissionAction, checked: boolean) => {
    setActions((current) => {
      const updated = { ...current, [module]: { ...(current[module as keyof ActionPermissions] ?? { view: true }), [action]: checked } };
      if (action === "view" && !checked) {
        const nextModules = selectedAccess.filter((item) => item !== module);
        setValue("sidebarAccess", nextModules, { shouldDirty: true, shouldValidate: true });
        delete updated[module as keyof ActionPermissions];
      } else if (action !== "view" && checked) { updated[module as keyof ActionPermissions] = { ...updated[module as keyof ActionPermissions], view: true }; }
      return updated;
    });
  };

  const handleFormSubmit = (data: UserFormData) => {
    if (!user && (!data.password || data.password.length < 4)) {
      setError("password", { type: "manual", message: "Password must be at least 4 characters" });
      return;
    }
    onSubmit({ ...data, sidebarAccess: selectedAccess, actionPermissions: parseActionPermissions(actions, selectedAccess) });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input id="firstName" {...register("firstName")} aria-invalid={!!errors.firstName} />
          {errors.firstName && (
            <p className="text-destructive text-xs">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input id="lastName" {...register("lastName")} aria-invalid={!!errors.lastName} />
          {errors.lastName && <p className="text-destructive text-xs">{errors.lastName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">
            Username <span className="text-destructive">*</span>
          </Label>
          <Input id="username" {...register("username")} aria-invalid={!!errors.username} />
          {errors.username && <p className="text-destructive text-xs">{errors.username.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            Password {!user && <span className="text-destructive">*</span>}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required={!user}
              minLength={user ? undefined : 4}
              maxLength={128}
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              placeholder={user ? "Leave blank to keep current" : ""}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <div className="relative">
            <select
              id="role"
              {...register("role")}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="user">User</option>
            </select>
            <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
              <svg
                className="text-muted-foreground size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <div className="relative">
            <select
              id="status"
              {...register("status")}
              className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm transition-all focus:ring-2 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
              <svg
                className="text-muted-foreground size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div><Label className="text-sm font-semibold">Module Access & Action Permissions</Label><p className="text-muted-foreground text-xs">Enable each module, then select the actions this User can perform. View is required for every enabled module.</p></div>
        <div className="space-y-3">
          {SIDEBAR_ITEMS.filter((item) => availableModules.includes(item.key)).map((item) => (
            <section key={item.key} className="border-border/60 rounded-xl border p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={selectedAccess.includes(item.key)} onChange={() => toggleAccess(item.key)} className="accent-primary size-4" />{item.label}</label>
              {selectedAccess.includes(item.key) && <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {PERMISSION_ACTIONS.filter((action) => action !== "import" || item.key === "import-export").filter((action) => action !== "export" || ["companies", "to-companies", "invoices", "proforma-invoices", "purchases", "referrals"].includes(item.key)).map((action) => <label key={action} className="text-muted-foreground flex items-center gap-2 text-xs capitalize"><input type="checkbox" checked={action === "view" ? actions[item.key as keyof ActionPermissions]?.view !== false : actions[item.key as keyof ActionPermissions]?.[action] === true} disabled={action === "view"} onChange={(event) => toggleAction(item.key, action, event.target.checked)} className="accent-primary size-3.5" />{action}</label>)}
              </div>}
            </section>
          ))}
        </div>
      </div>

      <div className="border-border/60 flex justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-gradient text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? "Saving..." : user ? "Update User" : "Add User"}
        </button>
      </div>
    </form>
  );
}
