import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, type SessionUser } from "@/lib/session";
import { hashPassword, verifyLegacyPassword, verifyPassword } from "@/lib/password";
import { MODULE_KEYS, type ModuleKey, type PermissionAction } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/auth-security";
import { allowsSuperadminApiRequest, getWorkspaceScope } from "@/lib/access-policy";

export { MODULE_KEYS };

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: SessionUser;
}

export async function authenticate(username: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { username: username.trim() } });

  if (!user || user.status !== "active") {
    return { success: false, error: "Invalid username or password" };
  }

  const passwordIsHashed = user.password.startsWith("scrypt$");
  const passwordMatches = passwordIsHashed
    ? await verifyPassword(password, user.password)
    : verifyLegacyPassword(password, user.password);

  if (!passwordMatches) return { success: false, error: "Invalid username or password" };

  if (!passwordIsHashed) {
    const upgradedHash = await hashPassword(password, false);
    await prisma.user.update({ where: { id: user.id }, data: { password: upgradedHash } });
  }

  let sidebarAccess: string[] = [];
  try {
    const parsed: unknown = JSON.parse(user.sidebarAccess || "[]");
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      sidebarAccess = parsed.filter((item) =>
        (MODULE_KEYS as readonly string[]).includes(item)
      );
    }
  } catch {
    sidebarAccess = [];
  }

  return {
    success: true,
    user: {
      id: user.id,
      workspaceId:
        user.role.toUpperCase() === "ADMIN" ? user.id : user.adminId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role.toUpperCase(),
      status: user.status,
      sidebarAccess,
    },
  };
}

export async function requireApiAccess(
  request: Request,
  module: ModuleKey,
  action: PermissionAction = "view",
  adminOnly = false
): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const role = user.role;
  if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "USER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (adminOnly && role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  if (role === "USER" && !user.sidebarAccess.includes(module)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  if (role === "SUPERADMIN" && !allowsSuperadminApiRequest(request.method, action)) {
    return NextResponse.json(
      { error: "Superadmin business access is read-only" },
      { status: 403 }
    );
  }

  if ((role === "ADMIN" || role === "USER") && !user.workspaceId) {
    return NextResponse.json(
      { error: "Your account has not been assigned to a workspace" },
      { status: 403 }
    );
  }

  if (role === "USER" && action !== "view") {
    return NextResponse.json(
      { error: "This action has not been granted to your account" },
      { status: 403 }
    );
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
  }

  return { user };
}

export function workspaceWhere(user: SessionUser) {
  return getWorkspaceScope(user.role, user.workspaceId);
}

export async function requireSuperadminApi(
  request: Request
): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
  }
  return { user };
}

export async function checkLoginRateLimit(username: string, ipAddress: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
  const usernameHash = createHash("sha256").update(username.trim().toLowerCase()).digest("hex");
  const ipHash = createHash("sha256").update(ipAddress).digest("hex");

  const [usernameAttempts, ipAttempts] = await Promise.all([
    prisma.loginAttempt.count({ where: { usernameHash, createdAt: { gt: windowStart } } }),
    prisma.loginAttempt.count({ where: { ipHash, createdAt: { gt: windowStart } } }),
  ]);

  return usernameAttempts < 5 && ipAttempts < 30;
}

export async function recordFailedLogin(username: string, ipAddress: string): Promise<void> {
  const usernameHash = createHash("sha256").update(username.trim().toLowerCase()).digest("hex");
  const ipHash = createHash("sha256").update(ipAddress).digest("hex");

  await prisma.loginAttempt.create({ data: { usernameHash, ipHash } });
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

export async function clearFailedLogins(username: string, ipAddress: string): Promise<void> {
  const usernameHash = createHash("sha256").update(username.trim().toLowerCase()).digest("hex");
  const ipHash = createHash("sha256").update(ipAddress).digest("hex");
  await prisma.loginAttempt.deleteMany({ where: { usernameHash, ipHash } });
}
