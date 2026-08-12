import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

import { sendOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.student.upsert({
      where: { email },
      update: { otp, otpExpiry: expiry, name },
      create: { email, name, otp, otpExpiry: expiry },
    });

    await sendOTP(email, otp);

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
