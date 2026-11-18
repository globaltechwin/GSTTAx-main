import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isSameOriginRequest } from "@/lib/auth-security";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || typeof (body as Record<string, unknown>).imageDataUrl !== "string") {
      return NextResponse.json({ error: "Select a valid profile image" }, { status: 400 });
    }

    const imageDataUrl = (body as { imageDataUrl: string }).imageDataUrl;
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageDataUrl);
    if (!match) return NextResponse.json({ error: "Only JPG, PNG and WebP images are supported" }, { status: 400 });

    const mimeType = match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES || buffer.toString("base64") !== base64) {
      return NextResponse.json({ error: "Image must be valid and smaller than 2 MB" }, { status: 400 });
    }

    const detectedMime =
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png" :
      buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "image/jpeg" :
      buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : null;

    if (detectedMime !== mimeType) {
      return NextResponse.json({ error: "The selected file does not match its image type" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { profileImage: imageDataUrl },
      select: { id: true },
    });
    return NextResponse.json({ success: true, message: "Profile photo updated successfully" });
  } catch (error) {
    console.error("Failed to update profile photo", error);
    return NextResponse.json({ error: "Unable to upload profile photo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  try {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { profileImage: null },
      select: { id: true },
    });
    return NextResponse.json({ success: true, message: "Profile photo removed" });
  } catch (error) {
    console.error("Failed to remove profile photo", error);
    return NextResponse.json({ error: "Unable to remove profile photo" }, { status: 500 });
  }
}
