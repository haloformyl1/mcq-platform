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

  cookieStore.delete("session");
  cookieStore.delete("admin_session");
  cookieStore.delete("piechem_device_id");
  return NextResponse.json({ success: true });
}
