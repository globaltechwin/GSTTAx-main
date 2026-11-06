type RequestLike = Pick<Request, "url" | "headers">;

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  expires?: Date;
  maxAge?: number;
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

export function isSameOriginRequest(request: RequestLike): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
    const forwardedProtocol = firstHeaderValue(request.headers.get("x-forwarded-proto"));
    const host = forwardedHost ?? request.headers.get("host") ?? requestUrl.host;
    const protocol = forwardedProtocol ?? requestUrl.protocol.slice(0, -1);

    if (
      !["http", "https"].includes(originUrl.protocol.slice(0, -1)) ||
      !["http", "https"].includes(protocol) ||
      originUrl.pathname !== "/" ||
      originUrl.search ||
      originUrl.hash
    ) {
      return false;
    }

    const targetUrl = new URL(`${protocol}://${host}`);
    return (
      targetUrl.pathname === "/" &&
      !targetUrl.username &&
      !targetUrl.password &&
      originUrl.origin === targetUrl.origin
    );
  } catch {
    return false;
  }
}

export function getSessionCookieOptions(
  request: RequestLike,
  expires?: Date,
  clear = false,
  production = process.env.NODE_ENV === "production"
): SessionCookieOptions {
  const requestUrl = new URL(request.url);
  const forwardedProtocol = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const secure = production || (forwardedProtocol ?? requestUrl.protocol.slice(0, -1)) === "https";

  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    ...(clear ? { expires: new Date(0), maxAge: 0 } : expires ? { expires } : {}),
  };
}

export async function invalidateSessionToken(
  token: string | undefined,
  deleteSession: (sessionToken: string) => Promise<unknown>,
  clearCookie: () => void
): Promise<void> {
  try {
    if (token) await deleteSession(token);
  } finally {
    clearCookie();
  }
}

export function getPortalRedirect(
  role: string | null,
  portal: "admin" | "superadmin"
): string | null {
  if (!role) return "/";
  if (portal === "admin" && role === "SUPERADMIN") return "/superadmin/dashboard";
  if (portal === "superadmin" && role !== "SUPERADMIN") return "/dashboard";
  return null;
}
