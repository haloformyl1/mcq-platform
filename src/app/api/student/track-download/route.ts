import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { studyMaterialId } = await req.json();

    if (!studyMaterialId) {
      return NextResponse.json({ allowed: false, message: "Missing study material ID" }, { status: 400 });
    }

    const cleanId = studyMaterialId.startsWith("db-") ? studyMaterialId.replace("db-", "") : studyMaterialId;

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = session ? await decrypt(session) : null;

    if (!payload || !payload.id) {
      return NextResponse.json({ allowed: false, message: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id: payload.id },
      select: { 
        id: true, 
        subscriptionStatus: true, 
        subscriptionExpiresAt: true,
      }
    });

    if (!student) {
      return NextResponse.json({ allowed: false, message: "Student not found" }, { status: 404 });
    }

    const isPremium = hasPremiumAccess(student.subscriptionStatus, student.subscriptionExpiresAt);

    // Get limits
    const dailyLimit = isPremium ? 5 : 3;
    const weeklyLimit = isPremium ? 18 : 10;

    // Calculate dates
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of week (Monday)
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - distanceToMonday);

    // Count downloads
    const dailyDownloads = await prisma.studentDownload.count({
      where: {
        studentId: student.id,
        createdAt: {
          gte: startOfDay,
        }
      }
    });

    const weeklyDownloads = await prisma.studentDownload.count({
      where: {
        studentId: student.id,
        createdAt: {
          gte: startOfWeek,
        }
      }
    });

    if (dailyDownloads >= dailyLimit) {
      return NextResponse.json({ 
        allowed: false, 
        message: `You have reached your daily download limit of ${dailyLimit} materials.` 
      });
    }

    if (weeklyDownloads >= weeklyLimit) {
      return NextResponse.json({ 
        allowed: false, 
        message: `You have reached your weekly download limit of ${weeklyLimit} materials.` 
      });
    }

    // Record the download
    await prisma.studentDownload.create({
      data: {
        studentId: student.id,
        studyMaterialId: cleanId,
      }
    });

    return NextResponse.json({ 
      allowed: true, 
      message: "Download approved",
      remainingDaily: dailyLimit - dailyDownloads - 1,
      remainingWeekly: weeklyLimit - weeklyDownloads - 1
    });

  } catch (error) {
    console.error("[TRACK_DOWNLOAD_ERROR]", error);
    return NextResponse.json({ allowed: false, message: "Internal server error" }, { status: 500 });
  }
}
