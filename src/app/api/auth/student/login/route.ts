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

    const student = await prisma.student.findUnique({
      where: { email },
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

    // Create session
    const sessionToken = await encrypt({
      id: student.id,
      email: student.email,
      role: "student",
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    await prisma.student.update({
      where: { id: student.id },
      data: { lastLogin: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
