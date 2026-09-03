import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { autoExpireSubscriptions, formatDateTime24 } from "@/lib/subscription";

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, subscriptionStatus } = body;
    
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-expire any overdue subscriptions first
    await autoExpireSubscriptions();

    const updateData: any = {};

    if (status) {
      if (status !== "ACTIVE" && status !== "SUSPENDED") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
    }

    if (subscriptionStatus) {
      const validStatuses = ["FREE", "COMPLIMENTARY", "PAID"];
      if (!validStatuses.includes(subscriptionStatus)) {
        return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 });
      }

      // Check if student has an active paid subscription validated by UPI UTR
      const currentStudent = await prisma.student.findUnique({
        where: { id },
        include: {
          upgradeRequests: {
            where: { status: "APPROVED", utrNumber: { not: null } },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      const hasActiveUpi = currentStudent?.subscriptionStatus === "PAID" &&
        currentStudent?.subscriptionExpiresAt &&
        new Date(currentStudent.subscriptionExpiresAt) > new Date() &&
        currentStudent.upgradeRequests &&
        currentStudent.upgradeRequests.length > 0;

      if (hasActiveUpi) {
        return NextResponse.json({
          error: `Cannot manually change status: Student has an active paid subscription validated by UPI UTR until ${formatDateTime24(currentStudent.subscriptionExpiresAt)}. It will automatically downgrade to FREE after their 30-day cycle ends.`
        }, { status: 403 });
      }

      updateData.subscriptionStatus = subscriptionStatus;

      if (subscriptionStatus === "COMPLIMENTARY") {
        // Admin Manual Upgrade: Full Premium Access for Free, NEVER EXPIRES!
        updateData.subscriptionStartedAt = new Date();
        updateData.subscriptionExpiresAt = null;
      } else if (subscriptionStatus === "FREE") {
        updateData.subscriptionStartedAt = null;
        updateData.subscriptionExpiresAt = null;
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      student: { 
        id: updatedStudent.id, 
        status: updatedStudent.status,
        subscriptionStatus: updatedStudent.subscriptionStatus,
        subscriptionExpiresAt: updatedStudent.subscriptionExpiresAt
      } 
    });
  } catch (error) {
    console.error("Update student status error:", error);
    return NextResponse.json({ error: "Failed to update student status" }, { status: 500 });
  }
}