"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormData } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "companies", label: "Company" },
  { key: "to-companies", label: "To Company" },
  { key: "invoices", label: "Invoice" },
  { key: "purchases", label: "Purchase" },
  { key: "turnover-report", label: "Turnover Report" },
  { key: "referrals", label: "Referral" },
  { key: "import-export", label: "Import/Export" },
  { key: "users", label: "Users" },
  { key: "settings", label: "Settings" },
];

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
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const [selectedAccess, setSelectedAccess] = useState<string[]>(user?.sidebarAccess || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      username: user?.username ?? "",
      password: "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      role: (user?.role as "admin" | "user") ?? "user",
      status: (user?.status as "active" | "inactive") ?? "active",
      sidebarAccess: user?.sidebarAccess ?? [],
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        password: "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role as "admin" | "user",
        status: user.status as "active" | "inactive",
        sidebarAccess: user.sidebarAccess,
      });
      setSelectedAccess(user.sidebarAccess);
    }
  }, [user, reset]);

  const toggleAccess = (key: string) => {
    setSelectedAccess((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      setValue("sidebarAccess", next);
      return next;
    });
  };

  const handleFormSubmit = (data: Record<string, unknown>) => {
    onSubmit({ ...data, sidebarAccess: selectedAccess } as UserFormData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input id="firstName" {...register("firstName")} aria-invalid={!!errors.firstName} />
          {errors.firstName && <p className="text-destructive text-xs">{errors.firstName.message}</p>}
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
          <Input
            id="password"
            type="password"
            {...register("password")}
            aria-invalid={!!errors.password}
            placeholder={user ? "Leave blank to keep current" : ""}
          />
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
              <option value="admin">Admin</option>
            </select>
            <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
              <svg className="text-muted-foreground size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
              <svg className="text-muted-foreground size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">Sidebar Access</Label>
        <p className="text-muted-foreground text-xs">Select which modules this user can access</p>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-6">
          {SIDEBAR_ITEMS.map((item) => (
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
