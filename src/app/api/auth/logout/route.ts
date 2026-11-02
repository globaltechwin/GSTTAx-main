import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/auth-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  try {
    await revokeCurrentSession(request);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout request failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to sign out right now. Please try again." },
      { status: 500 }
    );
  }
}
