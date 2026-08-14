import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body.username || "admin";
    const password = body.password || body.passcode;

    if (!password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Auto-seed default admin if no admin accounts exist in DB
    let admin = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim().toLowerCase() }
        ]
      }
    });

    const defaultPasscode = process.env.ADMIN_PASSCODE || "CHEMISTRY@2026";

    if (!admin) {
      const totalAdmins = await prisma.adminUser.count();
      if (totalAdmins === 0) {
        // Create initial default admin account
        const hashedPassword = await bcrypt.hash(defaultPasscode, 10);
        admin = await prisma.adminUser.create({
          data: {
            username: "admin",
            passwordHash: hashedPassword
          }
        });
      }
    }

    if (!admin) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Verify bcrypt password hash
    let isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    // Fallback: If legacy plaintext passcode is sent and matches default passcode, auto-upgrade password hash
    if (!isValidPassword && password === defaultPasscode) {
      isValidPassword = true;
      const newHash = await bcrypt.hash(password, 10);
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: newHash }
      });
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Generate admin session JWT token
    const sessionToken = await encrypt({
      id: admin.id,
      username: admin.username,
      role: "admin",
    });

    const res = NextResponse.json({ success: true, username: admin.username });
    res.cookies.set({
      name: 'admin_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
