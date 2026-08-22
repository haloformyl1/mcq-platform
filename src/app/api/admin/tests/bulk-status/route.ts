import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testIds, status, unlockAt, lockAt, postLockHoldMinutes } = await req.json();

    if (!Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json({ error: "No tests selected for bulk update." }, { status: 400 });
    }

    if (!["LIVE", "DRAFT", "UPCOMING", "EXPIRED", "PUBLISHED", "LOCKED", "SCHEDULE_EXPIRED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status option." }, { status: 400 });
    }

    let parsedUnlockAt: Date | null = unlockAt ? new Date(unlockAt) : null;
    let parsedLockAt: Date | null = lockAt ? new Date(lockAt) : null;
    let finalStatus = status;
    let holdMinutes = typeof postLockHoldMinutes !== 'undefined' && !isNaN(parseInt(postLockHoldMinutes)) ? parseInt(postLockHoldMinutes) : 4320;

    if (status === "LIVE" || status === "PUBLISHED") {
      finalStatus = "LIVE";
      parsedUnlockAt = null;
      parsedLockAt = null;
    } else if (status === "SCHEDULE_EXPIRED") {
      finalStatus = "SCHEDULE_EXPIRED";
      if (!parsedLockAt) {
        return NextResponse.json({ error: "Scheduled Expiry Date & Time is required." }, { status: 400 });
      }
      parsedUnlockAt = null;
    } else if (status === "UPCOMING" || status === "LOCKED") {
      finalStatus = "UPCOMING";
      if (!parsedUnlockAt) {
        return NextResponse.json({ error: "Unlock Date & Time is required for UPCOMING status." }, { status: 400 });
      }
      if (!parsedLockAt) {
        return NextResponse.json({ error: "Re-Lock Date & Time is required for UPCOMING status." }, { status: 400 });
      }
      if (parsedLockAt <= parsedUnlockAt) {
        return NextResponse.json({ error: "Re-Lock Date & Time must be later than Unlock Date & Time." }, { status: 400 });
      }
    } else if (status === "DRAFT" || status === "EXPIRED") {
      parsedUnlockAt = null;
      parsedLockAt = null;
    }

    const result = await prisma.test.updateMany({
      where: { id: { in: testIds } },
      data: {
        status: finalStatus,
        unlockAt: parsedUnlockAt,
        lockAt: parsedLockAt,
        postLockHoldMinutes: holdMinutes,
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Bulk status error:", error);
    return NextResponse.json({ error: "Failed to update selected tests." }, { status: 500 });
  }
}
