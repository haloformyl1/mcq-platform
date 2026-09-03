import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;

    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const payload = await decrypt(adminSession);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Invalid admin session" }, { status: 401 });
    }

    // Find or create dedicated admin test student
    const testEmail = "admin.test@student.local";
    let testStudent = await prisma.student.findUnique({
      where: { email: testEmail },
    });

    if (!testStudent) {
      testStudent = await prisma.student.create({
        data: {
          email: testEmail,
          name: "Admin Test Student",
          status: "ACTIVE",
        },
      });
    }

    // Generate student session JWT token
    const sessionToken = await encrypt({
      id: testStudent.id,
      email: testStudent.email,
      role: "student",
      isTestMode: true,
    });

    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true, redirectUrl: "/dashboard" });
  } catch (error) {
    console.error("Error setting test student session:", error);
    return NextResponse.json({ error: "Failed to switch to test student mode" }, { status: 500 });
  }
}
