export type WorkspaceScope =
  | { adminId: number }
  | { workspace: { is: { role: { in: string[] } } } }
  | Record<string, never>;

export function allowsSuperadminApiRequest(method: string, action: string): boolean {
  return action === "view" && ["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export function getWorkspaceScope(role: string, workspaceId: number | null): WorkspaceScope {
  if (role === "SUPERADMIN") {
    return { workspace: { is: { role: { in: ["admin", "ADMIN"] } } } };
  }
  if (role !== "ADMIN" && role !== "USER") throw new Error("Unsupported role");
  if (!workspaceId) throw new Error("A workspace is required for tenant-scoped data access");
  return { adminId: workspaceId };
}
