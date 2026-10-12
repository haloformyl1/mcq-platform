import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notificationService";

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
    const body = await req.json();
    const notificationId = body.notificationId || body.id;

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    await markNotificationAsRead(studentId, notificationId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notification Read Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}
