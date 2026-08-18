import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";

// Basic rate-limiting store: IP/Identifier -> { count, resetTime }
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local_client";
    const now = Date.now();
    const attempt = loginAttempts.get(ip) || { count: 0, resetTime: now + 15 * 60 * 1000 };

    if (now > attempt.resetTime) {
      attempt.count = 0;
      attempt.resetTime = now + 15 * 60 * 1000;
    }

    if (attempt.count >= 5) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

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
      attempt.count += 1;
      loginAttempts.set(ip, attempt);
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
      attempt.count += 1;
      loginAttempts.set(ip, attempt);
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Reset attempt counter on successful login
    loginAttempts.delete(ip);

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
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
