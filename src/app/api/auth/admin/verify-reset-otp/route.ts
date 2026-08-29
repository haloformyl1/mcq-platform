import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { decrypt, encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_recovery_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Recovery session expired or not found. Please request a new code." },
        { status: 400 }
      );
    }

    const payload = await decrypt(sessionToken);
    if (!payload || payload.type !== "admin_recovery" || !payload.otpHash || !payload.adminId) {
      return NextResponse.json(
        { error: "Invalid or expired recovery session. Please request a new code." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const otp = body?.otp;

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit verification code." },
        { status: 400 }
      );
    }

    // Verify OTP hash
    const isValidOtp = await bcrypt.compare(otp.trim(), payload.otpHash);
    if (!isValidOtp) {
      return NextResponse.json(
        { error: "Incorrect verification code. Please check your email and try again." },
        { status: 400 }
      );
    }

    let adminUsername = payload.username || "admin";

    // Attempt to query DB for current username with quick timeout
    try {
      const dbWork = prisma.adminUser.findUnique({
        where: { id: payload.adminId },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 1500)
      );
      const admin: any = await Promise.race([dbWork, timeoutPromise]);
      if (admin) {
        adminUsername = admin.username;
      }
    } catch (dbErr: any) {
      console.warn("DB notice in verify-reset-otp:", dbErr?.message || dbErr);
    }

    // Elevate recovery session to verified status (valid for 10 minutes to reset credentials)
    const verifiedToken = await encrypt(
      {
        adminId: payload.adminId,
        username: adminUsername,
        type: "admin_recovery",
        step: "verified",
      },
      "10m"
    );

    const res = NextResponse.json({
      success: true,
      username: adminUsername,
      message: "Verification successful.",
    });

    res.cookies.set({
      name: "admin_recovery_session",
      value: verifiedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Admin Verify Reset OTP Error:", error);
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
