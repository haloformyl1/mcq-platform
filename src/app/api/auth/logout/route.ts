import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revokeStudentSession } from "@/lib/sessionService";

export async function POST() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const deviceId = cookieStore.get("piechem_device_id")?.value;

  if (session && deviceId) {
    try {
      const payload = await decrypt(session);
      if (payload?.id) {
        await revokeStudentSession(payload.id, deviceId);
      }
    } catch (e) {
      // ignore
    }
  }

  const response = NextResponse.json({ success: true });
  
  response.cookies.set("session", "", { path: "/", maxAge: 0 });
  response.cookies.set("admin_session", "", { path: "/", maxAge: 0 });
  response.cookies.set("piechem_device_id", "", { path: "/", maxAge: 0 });

  return response;
}
