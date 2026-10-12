import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notificationService";

export const dynamic = "force-dynamic";

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
    let notificationIds: string[] | undefined = undefined;

    try {
      const body = await req.json();
      if (body && Array.isArray(body.notificationIds)) {
        notificationIds = body.notificationIds;
      }
    } catch {
      // Body may be empty if called without payload; fallback to all unread
    }

    const result = await markAllNotificationsAsRead(studentId, notificationIds);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Notifications Read-All Error:", errMessage);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
