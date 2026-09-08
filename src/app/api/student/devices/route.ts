import { NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import {
  touchOrCreateStudentSession,
  getActiveStudentSessions,
  revokeStudentSession,
  revokeAllStudentSessions,
} from "@/lib/sessionService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await decrypt(session);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.id;
    const { deviceId, isRevoked } = await touchOrCreateStudentSession(studentId, req, cookieStore);

    if (isRevoked) {
      cookieStore.delete("session");
      return NextResponse.json({ error: "Session has been revoked" }, { status: 401 });
    }

    const devices = await getActiveStudentSessions(studentId, deviceId);
    return NextResponse.json({ devices, currentDeviceId: deviceId });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await decrypt(session);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.id;
    const body = await req.json();
    const { action, targetId } = body;
    const currentDeviceId = cookieStore.get("piechem_device_id")?.value;

    if (action === "signout_device" && targetId) {
      await revokeStudentSession(studentId, targetId);

      const isSigningOutCurrent = targetId === currentDeviceId;
      if (isSigningOutCurrent) {
        cookieStore.delete("session");
      }

      const devices = await getActiveStudentSessions(studentId, currentDeviceId);
      return NextResponse.json({
        success: true,
        signedOutCurrent: isSigningOutCurrent,
        devices,
      });
    }

    if (action === "signout_all") {
      await revokeAllStudentSessions(studentId);
      cookieStore.delete("session");
      return NextResponse.json({
        success: true,
        signedOutCurrent: true,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing device session:", error);
    return NextResponse.json({ error: "Failed to manage session" }, { status: 500 });
  }
}
