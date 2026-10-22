import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { isDeviceSuspended } from "@/lib/sessionService";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const deviceId = cookieStore.get("piechem_device_id")?.value;
    if (deviceId && await isDeviceSuspended(deviceId)) {
      return NextResponse.json(
        { 
          error: "Your device is restricted because an account associated with this device has been suspended. Please contact +91 9830507435 or email mailarghyadeeproy@gmail.com for assistance.",
          deviceSuspended: true,
        }, 
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (student?.status === "SUSPENDED") {
      return NextResponse.json(
        { 
          error: "This student account is suspended. Password reset is not permitted while suspended. Contact +91 9830507435 or email mailarghyadeeproy@gmail.com.",
          accountSuspended: true,
        }, 
        { status: 403 }
      );
    }

    if (!student || student.otp !== otp || !student.otpExpiry) {
      return NextResponse.json({ error: "Invalid verification code. Please try again." }, { status: 401 });
    }

    if (new Date() > student.otpExpiry) {
      return NextResponse.json({ error: "This OTP has expired. Please request a new OTP." }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        passwordHash,
        otp: null,
        otpExpiry: null,
      },
    });

    // Create session
    const sessionToken = await encrypt({
      id: updatedStudent.id,
      email: updatedStudent.email,
      role: "student",
    });

    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 400, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

