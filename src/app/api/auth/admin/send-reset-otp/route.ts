import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { sendAdminRecoveryEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local_admin_reset";
    const now = Date.now();
    const limit = rateLimitMap.get(ip) || { count: 0, resetTime: now + 15 * 60 * 1000 };

    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 15 * 60 * 1000;
    }

    if (limit.count >= 10) {
      return NextResponse.json(
        { error: "Too many recovery attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    limit.count += 1;
    rateLimitMap.set(ip, limit);

    let adminUsername = "admin";
    let adminId = "admin-primary-id";

    // Attempt to query or seed admin user in DB with quick 2s timeout
    try {
      const dbWork = (async () => {
        let admin = await prisma.adminUser.findFirst({
          orderBy: { createdAt: "asc" },
        });

        if (!admin) {
          const defaultPasscode = process.env.ADMIN_PASSCODE || "CHEMISTRY@2026";
          const hashedPassword = await bcrypt.hash(defaultPasscode, 10);
          admin = await prisma.adminUser.create({
            data: {
              username: "admin",
              passwordHash: hashedPassword,
            },
          });
        }
        return admin;
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB query timeout")), 2000)
      );

      const admin: any = await Promise.race([dbWork, timeoutPromise]);
      if (admin) {
        adminUsername = admin.username;
        adminId = admin.id;
      }
    } catch (dbErr: any) {
      console.warn("DB connection notice in send-reset-otp:", dbErr?.message || dbErr);
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Send email directly to admin recovery mail via EmailJS
    await sendAdminRecoveryEmail(otp, adminUsername);

    // Create encrypted recovery session token valid for 10 minutes
    const recoveryToken = await encrypt(
      {
        adminId,
        username: adminUsername,
        otpHash,
        type: "admin_recovery",
        step: "otp_sent",
      },
      "10m"
    );

    const res = NextResponse.json({
      success: true,
      message: "A 6-digit verification code has been dispatched to the authorized administrator recovery email.",
    });

    res.cookies.set({
      name: "admin_recovery_session",
      value: recoveryToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Admin Send Reset OTP Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate recovery. Please try again." },
      { status: 500 }
    );
  }
}
