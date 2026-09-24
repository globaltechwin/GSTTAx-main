import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const result = await authenticate(username, password);

    if (result.success) {
      return NextResponse.json({ success: true, user: result.user });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 401 });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
