import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { 
  estimateAudienceCount, 
  dispatchAdminAnnouncement, 
  sanitizeActionUrl,
  ensureNotificationSchema
} from "@/lib/notificationService";

export const dynamic = "force-dynamic";

/**
 * Validates admin session cookie.
 */
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) return null;
  const payload = await decrypt(session);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureNotificationSchema();

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Action 1: Live audience estimation for composer preview
    if (action === "estimate") {
      const board = searchParams.get("board") || "ALL";
      const academicLevel = searchParams.get("academicLevel") || "ALL";
      const subscriptionStatus = (searchParams.get("subscriptionStatus") || "ALL") as "ALL" | "PAID" | "FREE";

      const count = await estimateAudienceCount({
        targetBoard: board,
        targetAcademicLevel: academicLevel,
        targetSubscription: subscriptionStatus
      });

      return NextResponse.json({ success: true, count });
    }

    // Action 2: Fetch history of recent announcements & legacy access requests
    const [recentAnnouncements, accessRequests] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT 
          COALESCE(metadata->>'announcementId', id) as "announcementId",
          title,
          message,
          category,
          priority,
          "actionLabel",
          "actionUrl",
          metadata->>'targetBoard' as "targetBoard",
          metadata->>'targetAcademicLevel' as "targetAcademicLevel",
          metadata->>'targetSubscription' as "targetSubscription",
          MIN("createdAt") as "dispatchedAt",
          COUNT(*)::int as "recipientCount"
        FROM "Notification"
        WHERE type = 'admin_announcement'
        GROUP BY 
          COALESCE(metadata->>'announcementId', id), 
          title, 
          message, 
          category, 
          priority, 
          "actionLabel", 
          "actionUrl", 
          metadata->>'targetBoard', 
          metadata->>'targetAcademicLevel', 
          metadata->>'targetSubscription'
        ORDER BY "dispatchedAt" DESC
        LIMIT 20;
      `).catch(() => []),

      prisma.testAccessRequest.findMany({
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          test: { select: { id: true, title: true, status: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 30
      }).catch(() => [])
    ]);

    return NextResponse.json({
      success: true,
      announcements: recentAnnouncements || [],
      accessRequests: accessRequests || [],
      pendingRequests: accessRequests || []
    });
  } catch (error: unknown) {
    console.error("Admin notifications GET error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch notifications data";
    return NextResponse.json({ 
      error: message,
      announcements: [],
      accessRequests: [],
      pendingRequests: []
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const category = ["announcements", "system", "ultra", "exams"].includes(body.category)
      ? body.category
      : "announcements";
    const priority = Boolean(body.priority);

    // Validate Title and Message
    if (!title || title.length > 200) {
      return NextResponse.json(
        { error: "Title is required and must be 200 characters or less." },
        { status: 400 }
      );
    }
    if (!message || message.length > 3000) {
      return NextResponse.json(
        { error: "Message is required and must be 3,000 characters or less." },
        { status: 400 }
      );
    }

    // Action Link & Validation
    const actionLabel = typeof body.actionLabel === "string" ? body.actionLabel.trim().slice(0, 50) : null;
    let actionUrl: string | null = null;
    if (typeof body.actionUrl === "string" && body.actionUrl.trim()) {
      actionUrl = sanitizeActionUrl(body.actionUrl.trim());
      if (!actionUrl) {
        return NextResponse.json(
          { error: "Action URL must be a valid relative path starting with '/' or official https://piechem.vercel.app URL." },
          { status: 400 }
        );
      }
    }

    // Target Criteria Validation
    const targetBoard = typeof body.targetBoard === "string" ? body.targetBoard.trim() : "ALL";
    const targetAcademicLevel = typeof body.targetAcademicLevel === "string" ? body.targetAcademicLevel.trim() : "ALL";
    const targetSubscription = ["ALL", "PAID", "FREE"].includes(body.targetSubscription)
      ? body.targetSubscription
      : "ALL";

    const announcementId = typeof body.announcementId === "string" && body.announcementId.trim()
      ? body.announcementId.trim()
      : `annc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const result = await dispatchAdminAnnouncement({
      title,
      message,
      category,
      priority,
      actionLabel,
      actionUrl,
      announcementId,
      filter: {
        targetBoard,
        targetAcademicLevel,
        targetSubscription
      }
    });

    const deliveryMsg = result.skippedCount > 0
      ? `Announcement processed for ${result.totalTargeted} student(s): ${result.insertedCount} delivered, ${result.skippedCount} skipped (already received).`
      : `Announcement dispatched to ${result.insertedCount} student(s) successfully.`;

    return NextResponse.json({
      ...result,
      message: deliveryMsg
    });
  } catch (error: unknown) {
    console.error("Admin dispatch announcement error:", error);
    const message = error instanceof Error ? error.message : "Failed to dispatch announcement.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}