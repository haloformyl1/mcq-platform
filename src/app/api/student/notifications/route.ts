import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { 
  getStudentNotifications, 
  deleteAllNotifications, 
  deleteNotification,
  seedContextualNotificationsForStudent 
} from "@/lib/notificationService";

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
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Seed initial notifications if first time user opens
    await seedContextualNotificationsForStudent(studentId);

    const result = await getStudentNotifications(studentId, { category, page, limit });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Notifications GET Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");

    if (notificationId) {
      await deleteNotification(studentId, notificationId);
      return NextResponse.json({ success: true, message: "Notification deleted" });
    } else {
      await deleteAllNotifications(studentId);
      return NextResponse.json({ success: true, message: "All notifications cleared" });
    }
  } catch (error: any) {
    console.error("Notifications DELETE Error:", error?.message || error);
    return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
  }
}
