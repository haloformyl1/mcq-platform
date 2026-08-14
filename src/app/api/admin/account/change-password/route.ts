import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await decrypt(adminSession);
    if (!payload || payload.role !== "admin" || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword, newUsername, newEmail } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.id }
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const updateData: any = {
      passwordHash: newPasswordHash,
    };

    if (newUsername && newUsername.trim() !== admin.username) {
      updateData.username = newUsername.trim();
    }

    if (newEmail && newEmail.trim() !== admin.email) {
      updateData.email = newEmail.trim().toLowerCase();
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: updateData
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change password error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Username or Email is already in use by another admin." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
