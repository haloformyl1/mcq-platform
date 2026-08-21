import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) return false;
  const payload = await decrypt(session);
  return payload && payload.role === "ADMIN";
}

// GET all announcements
export async function GET() {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error("GET /api/admin/announcements error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST new announcement
export async function POST(req: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      content,
      type,
      priority,
      bgGradient,
      textColor,
      badgeColor,
      badgeText,
      actionLabel,
      actionUrl,
      isMarquee,
      isDismissible,
      isActive,
      startAt,
      endAt
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and Content are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || "BANNER",
        priority: priority || "INFO",
        bgGradient: bgGradient || "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
        textColor: textColor || "text-amber-200",
        badgeColor: badgeColor || "bg-amber-500 text-black",
        badgeText: badgeText || "ANNOUNCEMENT",
        actionLabel: actionLabel || null,
        actionUrl: actionUrl || null,
        isMarquee: isMarquee !== undefined ? Boolean(isMarquee) : true,
        isDismissible: isDismissible !== undefined ? Boolean(isDismissible) : false,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null
      }
    });

    return NextResponse.json(announcement);
  } catch (error: any) {
    console.error("POST /api/admin/announcements error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

// PUT update announcement
export async function PUT(req: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    if (data.startAt !== undefined) {
      data.startAt = data.startAt ? new Date(data.startAt) : null;
    }
    if (data.endAt !== undefined) {
      data.endAt = data.endAt ? new Date(data.endAt) : null;
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/admin/announcements error:", error);
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

// DELETE announcement
export async function DELETE(req: Request) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/announcements error:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
