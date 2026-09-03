import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { email } });

    if (!student || student.otp !== otp || !student.otpExpiry) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    if (new Date() > student.otpExpiry) {
      return NextResponse.json({ error: "OTP expired" }, { status: 401 });
    }

    // Clear OTP
    await prisma.student.update({
      where: { id: student.id },
      data: { otp: null, otpExpiry: null },
    });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
