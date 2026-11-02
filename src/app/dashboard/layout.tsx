import { redirect } from "next/navigation";
import { DashboardPortalShell } from "@/components/auth/dashboard-portal-shell";
import { getSessionUser } from "@/lib/session";
import { getPortalRedirect } from "@/lib/auth-security";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const destination = getPortalRedirect(user?.role ?? null, "admin");
  if (destination) redirect(destination);

  return <DashboardPortalShell>{children}</DashboardPortalShell>;
}
