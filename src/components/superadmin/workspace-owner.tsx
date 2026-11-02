"use client";

import type { WorkspaceSummary } from "@/lib/data";
import { useSession } from "@/components/auth/session-provider";

export function WorkspaceOwner({ workspace }: { workspace?: WorkspaceSummary | null }) {
  const { user } = useSession();
  if (user.role !== "SUPERADMIN") return null;

  if (!workspace) {
    return <span className="text-muted-foreground block text-xs">Workspace: unassigned</span>;
  }

  const ownerName = `${workspace.firstName} ${workspace.lastName}`.trim();
  return (
    <span className="text-muted-foreground block truncate text-xs">
      Workspace: {ownerName || workspace.username} (#{workspace.id})
    </span>
  );
}
