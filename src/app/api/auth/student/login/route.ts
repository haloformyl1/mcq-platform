import { touchOrCreateStudentSession } from "@/lib/sessionService";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Dedicated Exclusive Admin Login Check
    if (normalizedEmail === "piechemotp@gmail.com") {
      if (password !== "CHEMISTRY@2026") {
        return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
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

        if (admin?.id) {
          adminId = admin.id;
        }
      } catch (dbErr) {
        console.error("Prisma admin sync (proceeding with session):", dbErr);
      }

      // Generate admin session JWT token
      const sessionToken = await encrypt({
        id: adminId,
        email: "piechemotp@gmail.com",
        username: "admin",
        role: "admin",
      });

      const cookieStore = await cookies();
      cookieStore.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 400,
        path: "/",
      });

      return NextResponse.json({ success: true, isAdmin: true, redirectUrl: "/admin" });
    }

    // Regular Student Login (strictly student role, no admin privileges)
    const student = await prisma.student.findUnique({
      where: { email: normalizedEmail },
    });

    if (!student || !student.passwordHash) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    if (student.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended. Please contact the administrator for assistance." }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, student.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    // Create student session
    const sessionToken = await encrypt({
      id: student.id,
      email: student.email,
      role: "student",
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
    });

    await prisma.student.update({
      where: { id: student.id },
      data: { lastLogin: new Date() }
    });

    try {
      await touchOrCreateStudentSession(student.id, req, cookieStore);
    } catch (err) {
      console.error("Device session registration error:", err);
    }

    const isOnboarded = Boolean(student.board && student.academicLevel);
    return NextResponse.json({ success: true, isAdmin: false, isOnboarded });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
