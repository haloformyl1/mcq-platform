import { NextResponse } from "next/server";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();
    if (!passcode) {
      return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
    }

    const validPasscode = process.env.ADMIN_PASSCODE || "CHEMISTRY@2026";

    if (passcode !== validPasscode) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    // Create session
    const sessionToken = await encrypt({
      role: "admin",
    });

    const cookieStore = await cookies();
    // Use object form for setting cookie to match Next.js cookies API
    cookieStore.set({
      name: "admin_session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
