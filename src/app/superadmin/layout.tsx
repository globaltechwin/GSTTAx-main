import { redirect } from "next/navigation";
import { SuperadminPortalShell } from "@/components/auth/superadmin-portal-shell";
import { getSessionUser } from "@/lib/session";
import { getPortalRedirect } from "@/lib/auth-security";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const destination = getPortalRedirect(user?.role ?? null, "superadmin");
  if (destination) redirect(destination);

  return <SuperadminPortalShell>{children}</SuperadminPortalShell>;
}
