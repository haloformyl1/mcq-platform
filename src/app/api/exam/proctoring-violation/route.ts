import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { attemptId, studentId, testId, violationType, message, snapshotBase64, warningNumber } = await req.json();

    if (!attemptId || !violationType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Lookup attempt if studentId or testId are missing from client call
    let targetStudentId = studentId;
    let targetTestId = testId;

    if (!targetStudentId || !targetTestId) {
      const attempt = await prisma.testAttempt.findUnique({
        where: { id: attemptId },
        select: { studentId: true, testId: true }
      });
      if (attempt) {
        targetStudentId = targetStudentId || attempt.studentId;
        targetTestId = targetTestId || attempt.testId;
      }
    }

    if (!targetStudentId || !targetTestId) {
      return NextResponse.json({ error: "Attempt or student not found" }, { status: 404 });
    }

    const violation = await prisma.proctoringViolation.create({
      data: {
        attemptId,
        studentId: targetStudentId,
        testId: targetTestId,
        violationType: violationType || "PROCTORING_VIOLATION",
        message: message || "Proctoring violation detected",
        snapshotBase64: snapshotBase64 || null,
        warningNumber: Number(warningNumber) || 1,
      }
    });

    return NextResponse.json({ success: true, violationId: violation.id });
  } catch (error) {
    console.error("Error logging proctoring violation:", error);
    return NextResponse.json({ error: "Failed to record proctoring violation" }, { status: 500 });
  }
}
