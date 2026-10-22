import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { validateStudentName, verifyNameWithAI } from "@/lib/nameValidation";
import { isDeviceSuspended } from "@/lib/sessionService";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, otp, name, password } = await req.json();

    if (!email || !otp || !password) {
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

    let sanitizedName = name;
    if (name) {
      const validation = validateStudentName(name);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error || "Invalid student name." }, { status: 400 });
      }
      sanitizedName = validation.sanitizedName;

      const aiCheck = await verifyNameWithAI(sanitizedName || name);
      if (!aiCheck.isValid) {
        return NextResponse.json({
          error: aiCheck.reason || "Inappropriate or offensive names are strictly prohibited. Please enter your genuine student name."
        }, { status: 400 });
      }
    }

    const student = await prisma.student.findUnique({
      where: { email },
    });

    if (student?.status === "SUSPENDED") {
      return NextResponse.json(
        { 
          error: "This student account is suspended. You cannot set up or access an account until your suspension is revoked. Contact +91 9830507435 or email mailarghyadeeproy@gmail.com.",
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

    const passwordHash = await bcrypt.hash(password, 10);

    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        passwordHash,
        otp: null,
        otpExpiry: null,
        ...(sanitizedName ? { name: sanitizedName } : {}),
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

    const isOnboarded = Boolean(updatedStudent.board && updatedStudent.academicLevel);
    return NextResponse.json({ success: true, isOnboarded });
  } catch (error) {
    console.error("Setup Account Error:", error);
    return NextResponse.json({ error: "Failed to setup account" }, { status: 500 });
  }
}

