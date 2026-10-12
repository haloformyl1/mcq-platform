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
    const result = await markAllNotificationsAsRead(studentId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Notifications Read-All Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
