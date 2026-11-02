import { NextResponse } from "next/server";
import {
  authenticate,
  checkLoginRateLimit,
  clearFailedLogins,
  recordFailedLogin,
} from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !("username" in body) ||
      !("password" in body) ||
      typeof body.username !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const { username, password } = body;
    if (!username.trim() || !password || password.length > 128) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (!(await checkLoginRateLimit(username, ipAddress))) {
      return NextResponse.json(
        { success: false, error: "Too many sign-in attempts. Try again later." },
        { status: 429 }
      );
    }

    const result = await authenticate(username, password);
    if (!result.success || !result.user) {
      await recordFailedLogin(username, ipAddress);
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await clearFailedLogins(username, ipAddress);
    const rememberMe = "rememberMe" in body && body.rememberMe === true;
    await createSession(result.user.id, rememberMe, request);
    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Login request failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to sign in right now" },
      { status: 500 }
    );
  }
}
