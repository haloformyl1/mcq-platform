import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOTP } from "@/lib/email";
import { validateStudentName, verifyNameWithAI } from "@/lib/nameValidation";
import { isDeviceSuspended } from "@/lib/sessionService";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check device restriction: If this device was used by a suspended account, block OTP / registration
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

    const existingStudent = await prisma.student.findUnique({ where: { email: normalizedEmail } });

    // Cannot create or verify account if this email is suspended
    if (existingStudent?.status === "SUSPENDED") {
      return NextResponse.json(
        {
          error: "This student account is suspended. You cannot register or log in until your suspension is revoked. Contact +91 9830507435 or email mailarghyadeeproy@gmail.com.",
          accountSuspended: true,
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

      // Deep AI safety evaluation for slang and regional offensive words
      const aiCheck = await verifyNameWithAI(sanitizedName || name);
      if (!aiCheck.isValid) {
        return NextResponse.json({
          error: aiCheck.reason || "Inappropriate or offensive names are strictly prohibited. Please enter your genuine student name."
        }, { status: 400 });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (existingStudent) {
      await prisma.student.update({
        where: { email: normalizedEmail },
        data: { 
          otp, 
          otpExpiry: expiry,
          ...(sanitizedName ? { name: sanitizedName } : {}) 
        },
      });
    } else {
      if (!sanitizedName) {
        return NextResponse.json({ error: "Name is required for new students" }, { status: 400 });
      }
      await prisma.student.create({
        data: { email: normalizedEmail, name: sanitizedName, otp, otpExpiry: expiry, board: null, academicLevel: null },
      });
    }

    await sendOTP(normalizedEmail, otp);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

