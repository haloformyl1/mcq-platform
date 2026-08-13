import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, otp, name, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (!student || student.otp !== otp || !student.otpExpiry) {
      return NextResponse.json({ error: "Invalid verification code. Please try again." }, { status: 401 });
    }

    if (new Date() > student.otpExpiry) {
      return NextResponse.json({ error: "This OTP has expired. Please request a new OTP." }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        passwordHash,
        otp: null,
        otpExpiry: null,
        ...(name ? { name } : {}),
      },
    });

    // Create session
    const sessionToken = await encrypt({
      id: updatedStudent.id,
      email: updatedStudent.email,
      role: "student",
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup Account Error:", error);
    return NextResponse.json({ error: "Failed to setup account" }, { status: 500 });
  }
}
