"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormData } from "@/lib/validations";
import { MODULE_KEYS } from "@/lib/permissions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  companies: "Company",
  "to-companies": "To Company (Sales)",
  invoices: "Invoice / Proforma Invoice",
  "delivery-challans": "Delivery Challan",
  purchases: "Purchase Invoice",
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
    }
  }, [user, reset]);

  const toggleAccess = (key: string) => {
    const next = selectedAccess.includes(key)
      ? selectedAccess.filter((item) => item !== key)
      : [...selectedAccess, key];
    setValue("sidebarAccess", next, { shouldDirty: true, shouldValidate: true });
  };

  const handleFormSubmit = (data: UserFormData) => {
    if (!user && (!data.password || data.password.length < 4)) {
      setError("password", { type: "manual", message: "Password must be at least 4 characters" });
      return;
    }
    onSubmit({ ...data, sidebarAccess: selectedAccess });
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
        <Label className="text-sm font-semibold">Sidebar Access</Label>
        <p className="text-muted-foreground text-xs">Select which modules this user can access</p>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-6">
          {SIDEBAR_ITEMS.filter((item) => availableModules.includes(item.key)).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleAccess(item.key)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                selectedAccess.includes(item.key)
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {item.label}
            </button>
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
