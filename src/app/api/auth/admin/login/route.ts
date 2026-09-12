import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || body.passcode;

    // Only PIECHEMOTP@GMAIL.COM with CHEMISTRY@2026 has admin access permitted
    if (identifier !== "piechemotp@gmail.com" && identifier !== "admin") {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (password !== "CHEMISTRY@2026") {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    let adminId = "admin-piechem";
    try {
      let admin = await prisma.adminUser.findFirst({
        where: {
          OR: [
            { email: "piechemotp@gmail.com" },
            { username: "admin" }
          ]
        }
      });

      const hashedPassword = await bcrypt.hash("CHEMISTRY@2026", 10);
      if (!admin) {
        admin = await prisma.adminUser.create({
          data: {
            username: "admin",
            email: "piechemotp@gmail.com",
            passwordHash: hashedPassword
          }
        });
      } else {
        admin = await prisma.adminUser.update({
          where: { id: admin.id },
          data: {
            email: "piechemotp@gmail.com",
            passwordHash: hashedPassword
          }
        });
      }
      if (admin?.id) adminId = admin.id;
    } catch (e) {
      console.error("Admin user sync error:", e);
    }

    // Generate admin session JWT token
    const sessionToken = await encrypt({
      id: adminId,
      username: "admin",
      email: "piechemotp@gmail.com",
      role: "admin",
    });

    const res = NextResponse.json({ success: true, username: "admin" });
    res.cookies.set({
      name: 'admin_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 400,
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
