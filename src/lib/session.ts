import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  getSessionCookieOptions,
  invalidateSessionToken,
} from "@/lib/auth-security";

export const SESSION_COOKIE = "gsttax_session";
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const REMEMBERED_SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: number;
  workspaceId: number | null;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  status: string;
  sidebarAccess: string[];
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number, rememberMe: boolean, request: Request) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + (rememberMe ? REMEMBERED_SESSION_LIFETIME_MS : SESSION_LIFETIME_MS)
  );

  await prisma.session.create({
    data: { userId, tokenHash: hashSessionToken(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions(request, expiresAt));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { include: { admin: { select: { status: true, sidebarAccess: true } } } } },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    session.user.status !== "active" ||
    (session.user.role.toUpperCase() === "USER" && session.user.admin?.status !== "active")
  ) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  let sidebarAccess: string[] = [];
  try {
    const parsed: unknown = JSON.parse(session.user.sidebarAccess || "[]");
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      sidebarAccess = parsed;
    }
  } catch {
    sidebarAccess = [];
  }

  return {
    id: session.user.id,
    workspaceId:
      session.user.role.toUpperCase() === "ADMIN"
        ? session.user.id
        : session.user.adminId,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    username: session.user.username,
    role: session.user.role.toUpperCase(),
    status: session.user.status,
    sidebarAccess:
      session.user.role.toUpperCase() === "USER"
        ? sidebarAccess.filter((module) => {
            try {
              const parentModules: unknown = JSON.parse(session.user.admin?.sidebarAccess || "[]");
              return Array.isArray(parentModules) && parentModules.includes(module);
            } catch {
              return false;
            }
          })
        : sidebarAccess,
  };
}

export async function revokeCurrentSession(request: Request): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  await invalidateSessionToken(
    token,
    async (sessionToken) =>
      prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(sessionToken) } }),
    () => cookieStore.set(SESSION_COOKIE, "", getSessionCookieOptions(request, undefined, true))
  );
}
