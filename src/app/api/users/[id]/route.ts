import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true, firstName: true, lastName: true, username: true,
        email: true, phone: true, role: true, status: true, sidebarAccess: true, createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      sidebarAccess: user.sidebarAccess ? JSON.parse(user.sidebarAccess) : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, username, password, email, phone, role, status, sidebarAccess } = body;

    const updateData: Record<string, unknown> = {
      firstName,
      lastName,
      username,
      email: email || null,
      phone: phone || null,
      role: role || "user",
      status: status || "active",
      sidebarAccess: JSON.stringify(sidebarAccess || []),
    };

    if (password) {
      updateData.password = password;
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      ...user,
      sidebarAccess: user.sidebarAccess ? JSON.parse(user.sidebarAccess) : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
