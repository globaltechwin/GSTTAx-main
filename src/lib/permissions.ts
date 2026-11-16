export const MODULE_KEYS = [
  "dashboard", "products", "companies", "to-companies", "invoices", "proforma-invoices",
  "delivery-challans", "purchases", "vendors", "purchase-orders",
  "turnover-report", "referrals", "import-export", "users", "settings",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
export type PermissionAction = "view" | "create" | "update" | "delete" | "export" | "import";
export const PERMISSION_ACTIONS: readonly PermissionAction[] = ["view", "create", "update", "delete", "export", "import"];
export type ActionPermissions = Record<string, Partial<Record<PermissionAction, boolean>>>;

export function isModuleKey(value: unknown): value is ModuleKey {
  return typeof value === "string" && (MODULE_KEYS as readonly string[]).includes(value);
}

/** Canonical module names used across the sidebar, Admin workspace and user permissions UI.
 * Keep these labels in sync with src/components/dashboard/sidebar.tsx.
 */
export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  products: "Product Management",
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

export function getModuleLabel(module: string): string {
  return isModuleKey(module) ? MODULE_LABELS[module] : module;
}

export function defaultActionPermissions(modules: readonly string[]): ActionPermissions {
  return Object.fromEntries(modules.filter(isModuleKey).map((module) => [module, { view: true }])) as ActionPermissions;
}

export function parseActionPermissions(value: unknown, modules: readonly string[] = []): ActionPermissions {
  let parsed: unknown = value;
  if (typeof value === "string") { try { parsed = JSON.parse(value || "{}"); } catch { parsed = {}; } }
  const result: ActionPermissions = {};
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const [module, actions] of Object.entries(parsed as Record<string, unknown>)) {
      if (!isModuleKey(module) || !modules.includes(module) || !actions || typeof actions !== "object" || Array.isArray(actions)) continue;
      const safe: Partial<Record<PermissionAction, boolean>> = {};
      for (const action of PERMISSION_ACTIONS) {
        const flag = (actions as Record<string, unknown>)[action];
        if (typeof flag === "boolean") safe[action] = flag;
      }
      if (safe.view) result[module] = safe;
    }
  }
  // Existing users with module access but no action-permission record retain view-only access.
  for (const module of modules) if (isModuleKey(module) && !result[module]) result[module] = { view: true };
  return result;
}

export function canPerform(permissions: ActionPermissions | undefined, module: ModuleKey, action: PermissionAction): boolean {
  return permissions?.[module]?.[action] === true;
}
