"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Layers, Check, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormData } from "@/lib/validations";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  PERMISSION_ACTIONS,
  parseActionPermissions,
  type ActionPermissions,
  type PermissionAction,
} from "@/lib/permissions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";



const EXPORTABLE_MODULES = new Set([
  "companies", "to-companies", "invoices", "proforma-invoices", "purchases", "referrals",
]);

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
  export: "Export",
  import: "Import",
};

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

export function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading,
  availableModules = [...MODULE_KEYS],
}: UserFormProps) {
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
  const [actions, setActions] = useState<ActionPermissions>(
    parseActionPermissions(user?.actionPermissions, user?.sidebarAccess ?? []),
  );
  const [showPassword, setShowPassword] = useState(false);

  const visibleModules = useMemo(
    () => MODULE_KEYS.filter((key) => availableModules.includes(key)),
    [availableModules],
  );

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
    } else {
      setActions({});
    }
  }, [user, reset]);

  const availableActions = (module: string): PermissionAction[] =>
    PERMISSION_ACTIONS.filter(
      (action) =>
        (action !== "import" || module === "import-export") &&
        (action !== "export" || EXPORTABLE_MODULES.has(module)),
    );

  const toggleModule = (module: string, enabled: boolean) => {
    const next = enabled
      ? [...selectedAccess, module]
      : selectedAccess.filter((item) => item !== module);

    setValue("sidebarAccess", next, { shouldDirty: true, shouldValidate: true });
    setActions((current) => {
      const updated = { ...current };
      if (enabled) updated[module] = { view: true };
      else delete updated[module];
      return updated;
    });
  };

  const toggleAction = (module: string, action: PermissionAction, checked: boolean) => {
    setActions((current) => {
      const updated: ActionPermissions = {
        ...current,
        [module]: {
          ...(current[module] ?? { view: true }),
          [action]: action === "view" ? true : checked,
          view: true,
        },
      };
      return updated;
    });
  };

  const toggleAllActions = (module: string, checked: boolean) => {
    const next: Partial<Record<PermissionAction, boolean>> = { view: true };
    for (const action of availableActions(module)) {
      if (action !== "view") next[action] = checked;
    }
    setActions((current) => ({ ...current, [module]: next }));
  };

  const selectAllModules = () => {
    setValue("sidebarAccess", [...visibleModules], { shouldDirty: true, shouldValidate: true });
    setActions((current) => {
      const updated: ActionPermissions = { ...current };
      for (const module of visibleModules) {
        if (!updated[module]) updated[module] = { view: true };
      }
      return updated;
    });
  };

  const clearAllModules = () => {
    setValue("sidebarAccess", [], { shouldDirty: true, shouldValidate: true });
    setActions({});
  };

  const handleFormSubmit = (data: UserFormData) => {
    if (!user && (!data.password || data.password.length < 4)) {
      setError("password", {
        type: "manual",
        message: "Password must be at least 4 characters",
      });
      return;
    }
    onSubmit({
      ...data,
      sidebarAccess: selectedAccess,
      actionPermissions: parseActionPermissions(actions, selectedAccess),
    });
  };

  const isAllSelected = visibleModules.length > 0 && visibleModules.every((key) => selectedAccess.includes(key));

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
            <Input id="firstName" {...register("firstName")} aria-invalid={!!errors.firstName} />
            {errors.firstName && <p className="text-destructive text-xs">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
            <Input id="lastName" {...register("lastName")} aria-invalid={!!errors.lastName} />
            {errors.lastName && <p className="text-destructive text-xs">{errors.lastName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
            <Input id="username" {...register("username")} aria-invalid={!!errors.username} />
            {errors.username && <p className="text-destructive text-xs">{errors.username.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password {!user && <span className="text-destructive">*</span>}</Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              {...register("role")}
              className="border-border/60 bg-background focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="user">User</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="border-border/60 bg-background focus:ring-primary/20 h-10 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-border/70">
          <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Module Access & Action Permissions</h3>
                <p className="text-muted-foreground text-xs">Choose modules and control what this user can do in each module.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={selectAllModules}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
              >
                <Check className="size-3.5" /> Select All
              </button>
              <button
                type="button"
                onClick={clearAllModules}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                <X className="size-3.5" /> Clear All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground">
                  <th className="w-[26%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Module</th>
                  <th className="w-[15%] px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide">Module Access</th>
                  {PERMISSION_ACTIONS.map((action) => (
                    <th key={action} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide">{ACTION_LABELS[action]}</th>
                  ))}
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide">All</th>
                </tr>
              </thead>
              <tbody>
                {visibleModules.map((module) => {
                  const enabled = selectedAccess.includes(module);
                  const actionsForModule = availableActions(module);
                  const allChecked = actionsForModule.filter((action) => action !== "view").every(
                    (action) => actions[module]?.[action] === true,
                  );
                  return (
                    <tr key={module} className="border-t border-border/60 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("flex size-7 items-center justify-center rounded-lg", enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                            <Layers className="size-3.5" />
                          </span>
                          <div>
                            <p className="font-semibold leading-tight">{MODULE_LABELS[module] ?? module}</p>
                            <p className="text-muted-foreground mt-0.5 text-[10px]">Manage {MODULE_LABELS[module]?.toLowerCase() ?? module}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={`${enabled ? "Disable" : "Enable"} ${MODULE_LABELS[module] ?? module}`}
                          onClick={() => toggleModule(module, !enabled)}
                          className={cn("relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", enabled ? "bg-primary" : "bg-muted-foreground/30")}
                        >
                          <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-5" : "translate-x-0.5")} />
                        </button>
                      </td>
                      {PERMISSION_ACTIONS.map((action) => {
                        const supported = actionsForModule.includes(action);
                        const checked = action === "view" ? enabled : actions[module]?.[action] === true;
                        return (
                          <td key={action} className="px-2 py-2.5 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${MODULE_LABELS[module] ?? module} ${ACTION_LABELS[action]}`}
                              checked={action === "view" ? enabled : checked}
                              disabled={!enabled || !supported || action === "view"}
                              onChange={(event) => toggleAction(module, action, event.target.checked)}
                              className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${MODULE_LABELS[module] ?? module} all permissions`}
                          checked={enabled && allChecked}
                          disabled={!enabled || actionsForModule.length <= 1}
                          onChange={(event) => toggleAllActions(module, event.target.checked)}
                          className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/10 px-4 py-2">
            <p className="text-muted-foreground text-xs">
              <span className="font-semibold text-foreground">{selectedAccess.length}</span> modules enabled
              <span className="mx-2">•</span>
              <span className="font-semibold text-foreground">{visibleModules.length - selectedAccess.filter((key) => (visibleModules as readonly string[]).includes(key)).length}</span> modules disabled
            </p>
            <p className="text-muted-foreground text-[11px]">View access is required for every enabled module.</p>
          </div>
        </section>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border/70 bg-background px-5 py-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-gradient inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? "Saving..." : user ? "Save Changes" : "Create User"}
        </button>
      </div>
    </form>
  );
}
