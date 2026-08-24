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

    const { sourceStudentId, targetStudentId, deleteSourceAccount = false } = await req.json();

    if (!sourceStudentId || !targetStudentId) {
      return NextResponse.json({ error: "Both sourceStudentId and targetStudentId are required." }, { status: 400 });
    }

    if (sourceStudentId === targetStudentId) {
      return NextResponse.json({ error: "Source and Target student accounts must be different." }, { status: 400 });
    }

    // Verify both students exist
    const [sourceStudent, targetStudent] = await Promise.all([
      prisma.student.findUnique({ where: { id: sourceStudentId } }),
      prisma.student.findUnique({ where: { id: targetStudentId } }),
    ]);

    if (!sourceStudent) {
      return NextResponse.json({ error: "Source student not found." }, { status: 404 });
    }

    if (!targetStudent) {
      return NextResponse.json({ error: "Target student not found." }, { status: 404 });
    }

    // Perform transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Transfer Test Attempts & Answers
      const attemptsCount = await tx.testAttempt.updateMany({
        where: { studentId: sourceStudentId },
        data: { studentId: targetStudentId }
      });

      // 2. Transfer Proctoring Warnings
      const warningsCount = await tx.proctoringWarningLog.updateMany({
        where: { studentId: sourceStudentId },
        data: { studentId: targetStudentId }
      });

      // 3. Transfer Subscription Upgrade Requests
      const subRequestsCount = await tx.subscriptionUpgradeRequest.updateMany({
        where: { studentId: sourceStudentId },
        data: { studentId: targetStudentId }
      });

      // 4. Transfer Student Test Overrides (merging to avoid unique constraint violations)
      const targetOverrides = await tx.studentTestOverride.findMany({
        where: { studentId: targetStudentId },
        select: { testId: true }
      });
      const targetTestIdsWithOverride = new Set(targetOverrides.map(o => o.testId));

      const sourceOverrides = await tx.studentTestOverride.findMany({
        where: { studentId: sourceStudentId }
      });

      let overridesTransferred = 0;
      for (const override of sourceOverrides) {
        if (!targetTestIdsWithOverride.has(override.testId)) {
          await tx.studentTestOverride.update({
            where: { id: override.id },
            data: { studentId: targetStudentId }
          });
          overridesTransferred++;
        } else {
          await tx.studentTestOverride.delete({ where: { id: override.id } });
        }
      }

      // 5. Transfer Test Access Requests (merging to avoid unique constraint violations)
      const targetAccessReqs = await tx.testAccessRequest.findMany({
        where: { studentId: targetStudentId },
        select: { testId: true }
      });
      const targetTestIdsWithAccessReq = new Set(targetAccessReqs.map(r => r.testId));

      const sourceAccessReqs = await tx.testAccessRequest.findMany({
        where: { studentId: sourceStudentId }
      });

      let accessReqsTransferred = 0;
      for (const accessReq of sourceAccessReqs) {
        if (!targetTestIdsWithAccessReq.has(accessReq.testId)) {
          await tx.testAccessRequest.update({
            where: { id: accessReq.id },
            data: { studentId: targetStudentId }
          });
          accessReqsTransferred++;
        } else {
          await tx.testAccessRequest.delete({ where: { id: accessReq.id } });
        }
      }

      // 6. Delete source student account if requested
      let sourceDeleted = false;
      if (deleteSourceAccount) {
        await tx.student.delete({ where: { id: sourceStudentId } });
        sourceDeleted = true;
      }

      return {
        transferredAttempts: attemptsCount.count,
        transferredWarnings: warningsCount.count,
        transferredSubRequests: subRequestsCount.count,
        transferredOverrides: overridesTransferred,
        transferredAccessRequests: accessReqsTransferred,
        sourceDeleted
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred data from ${sourceStudent.email} to ${targetStudent.email}.`,
      details: result
    });
  } catch (error) {
    console.error("Transfer Student Data Error:", error);
    return NextResponse.json({ error: "Failed to transfer student data." }, { status: 500 });
  }
}
