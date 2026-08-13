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

    // Create session (include `id` so older deployed routes that expect payload.id accept it)
    const sessionToken = await encrypt({
      role: "admin",
      id: process.env.ADMIN_ID || 'admin'
    });

    // Build response and explicitly set cookie on it to ensure Set-Cookie is returned
    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: 'admin_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return res;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: error?.message || "Login failed" }, { status: 500 });
  }
}
