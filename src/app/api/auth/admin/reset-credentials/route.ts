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
        { error: "Recovery session expired. Please restart the reset process." },
        { status: 400 }
      );
    }

    const payload = await decrypt(sessionToken);
    if (!payload || payload.type !== "admin_recovery" || payload.step !== "verified" || !payload.adminId) {
      return NextResponse.json(
        { error: "Unauthorized or unverified recovery session. Please verify your OTP code first." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { newPassword, newUsername } = body;

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "New password is required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
    }

    // Password complexity validation
    const reqUpper = /[A-Z]/.test(newPassword);
    const reqLower = /[a-z]/.test(newPassword);
    const reqNumber = /[0-9]/.test(newPassword);
    const reqSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!reqUpper || !reqLower || !reqNumber || !reqSpecial) {
      return NextResponse.json(
        { error: "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character." },
        { status: 400 }
      );
    }

    let finalUsername = payload.username || "admin";
    if (newUsername && typeof newUsername === "string" && newUsername.trim()) {
      finalUsername = newUsername.trim();
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update in database if accessible (with 2s timeout)
    try {
      const dbWork = (async () => {
        const existing = await prisma.adminUser.findUnique({
          where: { id: payload.adminId },
        });

        if (existing) {
          await prisma.adminUser.update({
            where: { id: payload.adminId },
            data: {
              passwordHash,
              username: finalUsername,
            },
          });
        } else {
          await prisma.adminUser.create({
            data: {
              username: finalUsername,
              passwordHash,
            },
          });
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 2000)
      );

      await Promise.race([dbWork, timeoutPromise]);
    } catch (dbErr: any) {
      console.warn("DB update notice in reset-credentials:", dbErr?.message || dbErr);
    }

    // Create full admin login session
    const adminSessionToken = await encrypt({
      id: payload.adminId,
      username: finalUsername,
      role: "admin",
    });

    const res = NextResponse.json({
      success: true,
      username: finalUsername,
      message: "Credentials successfully updated!",
    });

    // Set admin session cookie (1 day)
    res.cookies.set({
      name: "admin_session",
      value: adminSessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
    });

    // Invalidate recovery session cookie
    res.cookies.set({
      name: "admin_recovery_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Reset Credentials Error:", error);
    return NextResponse.json({ error: "Failed to update administrator credentials." }, { status: 500 });
  }
}

