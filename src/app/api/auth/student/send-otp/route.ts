import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOTP } from "@/lib/email";
import { validateStudentName } from "@/lib/nameValidation";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    let sanitizedName = name;
    if (name) {
      const validation = validateStudentName(name);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error || "Invalid student name." }, { status: 400 });
      }
      sanitizedName = validation.sanitizedName;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const existingStudent = await prisma.student.findUnique({ where: { email } });

    if (existingStudent) {
      await prisma.student.update({
        where: { email },
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
        data: { email, name: sanitizedName, otp, otpExpiry: expiry, board: null, academicLevel: null },
      });
    }

    await sendOTP(email, otp);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
