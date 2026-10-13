import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { autoExpireSubscriptions } from "@/lib/subscription";
import { notifyMembershipActivated } from "@/lib/notificationService";

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, subscriptionStatus, board, academicLevel } = body;
    
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
      const normalizedStatus = String(subscriptionStatus).trim().toUpperCase();
      const validStatuses = ["FREE", "ULTRA", "COMPLIMENTARY"];
      if (!validStatuses.includes(normalizedStatus)) {
        return NextResponse.json({ error: "Invalid subscription status. Choose FREE or ULTRA." }, { status: 400 });
      }

      if (normalizedStatus === "ULTRA" || normalizedStatus === "COMPLIMENTARY") {
        // Admin Privilege: Promote to PIE Ultra (Permanent VIP access until admin revokes)
        updateData.subscriptionStatus = "ULTRA";
        updateData.isComplimentary = true;
        updateData.subscriptionStartedAt = new Date();
        updateData.subscriptionExpiresAt = null;
        if (board) updateData.board = board;
        if (academicLevel) updateData.academicLevel = academicLevel;
      } else if (normalizedStatus === "FREE") {
        updateData.subscriptionStatus = "FREE";
        updateData.isComplimentary = false;
        updateData.subscriptionStartedAt = null;
        updateData.subscriptionExpiresAt = null;
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData
    });

    if (updateData.subscriptionStatus === "ULTRA") {
      try {
        await notifyMembershipActivated({
          studentId: id,
          planTier: "ultra",
          isComplimentary: true,
          expiresAt: null
        });
      } catch (notifyErr) {
        console.error("Failed to send Ultra activation notification:", notifyErr);
      }
    }

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