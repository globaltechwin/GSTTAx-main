export const MODULE_KEYS = [
  "dashboard",
  "companies",
  "to-companies",
  "invoices",
  "purchases",
  "turnover-report",
  "referrals",
  "import-export",
  "users",
  "settings",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
export type PermissionAction = "view" | "create" | "update" | "delete" | "export" | "import";

export function isModuleKey(value: unknown): value is ModuleKey {
  return typeof value === "string" && (MODULE_KEYS as readonly string[]).includes(value);
}
