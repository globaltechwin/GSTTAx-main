import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPortalRedirect,
  getSessionCookieOptions,
  invalidateSessionToken,
  isSameOriginRequest,
} from "./auth-security.ts";
import { requestLogout } from "./logout-client.ts";
import { allowsSuperadminApiRequest, getWorkspaceScope } from "./access-policy.ts";

test("same-origin validation accepts localhost and forwarded HTTPS tunnel requests", () => {
  const localhostRequest = new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
  });
  const tunnelRequest = new Request("http://127.0.0.1:3000/api/auth/logout", {
    method: "POST",
    headers: {
      origin: "https://example.devtunnels.ms",
      host: "127.0.0.1:3000",
      "x-forwarded-host": "example.devtunnels.ms",
      "x-forwarded-proto": "https",
    },
  });

  assert.equal(isSameOriginRequest(localhostRequest), true);
  assert.equal(isSameOriginRequest(tunnelRequest), true);
});

test("same-origin validation rejects missing, malformed, and cross-site origins", () => {
  const missingOrigin = new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
  });
  const crossSiteOrigin = new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: { origin: "https://attacker.example" },
  });
  const malformedOrigin = new Request("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: { origin: "not-an-origin" },
  });

  assert.equal(isSameOriginRequest(missingOrigin), false);
  assert.equal(isSameOriginRequest(crossSiteOrigin), false);
  assert.equal(isSameOriginRequest(malformedOrigin), false);
});

test("session cookies retain their host-only root scope and use HTTPS when externally served", () => {
  const localhostRequest = new Request("http://localhost:3000");
  const tunnelRequest = new Request("http://127.0.0.1:3000", {
    headers: { "x-forwarded-proto": "https" },
  });
  const clearOptions = getSessionCookieOptions(tunnelRequest, undefined, true, false);

  assert.deepEqual(getSessionCookieOptions(localhostRequest, undefined, false, false), {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  assert.deepEqual(clearOptions, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
  assert.equal(getSessionCookieOptions(localhostRequest, undefined, false, true).secure, true);
  assert.equal("domain" in clearOptions, false);
});

test("successful logout invalidates only the current token and clears its cookie", async () => {
  const deletedTokens = [];
  let cookieCleared = false;

  await invalidateSessionToken(
    "current-session-token",
    async (token) => {
      deletedTokens.push(token);
      return 1;
    },
    () => {
      cookieCleared = true;
    }
  );

  assert.deepEqual(deletedTokens, ["current-session-token"]);
  assert.equal(cookieCleared, true);
});

test("logout succeeds for a session that has already expired or been removed", async () => {
  let cookieCleared = false;

  await assert.doesNotReject(
    invalidateSessionToken(
      "expired-session-token",
      async () => 0,
      () => {
        cookieCleared = true;
      }
    )
  );

  assert.equal(cookieCleared, true);
});

test("failed session deletion still clears the cookie and reports failure", async () => {
  let cookieCleared = false;

  await assert.rejects(
    invalidateSessionToken(
      "current-session-token",
      async () => {
        throw new Error("database unavailable");
      },
      () => {
        cookieCleared = true;
      }
    ),
    /database unavailable/
  );
  assert.equal(cookieCleared, true);
});

test("protected portal redirects send unauthenticated users to login after logout", () => {
  assert.equal(getPortalRedirect(null, "admin"), "/");
  assert.equal(getPortalRedirect(null, "superadmin"), "/");
  assert.equal(getPortalRedirect("SUPERADMIN", "admin"), "/superadmin");
  assert.equal(getPortalRedirect("ADMIN", "superadmin"), "/dashboard");
  assert.equal(getPortalRedirect("SUPERADMIN", "superadmin"), null);
});

test("client logout sends the same-origin request and accepts a successful response", async () => {
  let requestUrl;
  let requestOptions;
  await requestLogout(async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  assert.equal(requestUrl, "/api/auth/logout");
  assert.equal(requestOptions.method, "POST");
  assert.equal(requestOptions.credentials, "same-origin");
  assert.equal(requestOptions.cache, "no-store");
});

test("client logout reports server errors and network failures without clearing local auth", async () => {
  await assert.rejects(
    requestLogout(async () =>
      new Response(JSON.stringify({ error: "Invalid request origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    ),
    /Invalid request origin/
  );
  await assert.rejects(
    requestLogout(async () => {
      throw new TypeError("connection failed");
    }),
    /Network error while signing out/
  );
  await assert.rejects(
    requestLogout(async () => new Response("unavailable", { status: 503 })),
    /HTTP 503/
  );
});

test("Superadmin business API access is limited to read requests", () => {
  assert.equal(allowsSuperadminApiRequest("GET", "view"), true);
  assert.equal(allowsSuperadminApiRequest("HEAD", "view"), true);
  assert.equal(allowsSuperadminApiRequest("POST", "view"), false);
  assert.equal(allowsSuperadminApiRequest("GET", "update"), false);
});

test("workspace query scope preserves tenant isolation and excludes unassigned data", () => {
  assert.deepEqual(getWorkspaceScope("ADMIN", 27), { adminId: 27 });
  assert.deepEqual(getWorkspaceScope("USER", 27), { adminId: 27 });
  assert.deepEqual(getWorkspaceScope("SUPERADMIN", null), {
    workspace: { is: { role: { in: ["admin", "ADMIN"] } } },
  });
  assert.throws(() => getWorkspaceScope("USER", null), /workspace is required/);
});
