import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

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

    const { attemptId, violationType, warningNumber, message, snapshotBase64, confidenceScore } = await req.json();

    if (!attemptId || !violationType) {
      return NextResponse.json({ error: "Missing attemptId or violationType" }, { status: 400 });
    }

    // Verify attempt belongs to student
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: { test: true }
    });

    if (!attempt || attempt.studentId !== payload.id) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 403 });
    }

    const violation = await prisma.proctoringViolation.create({
      data: {
        attemptId: attemptId,
        violationType: violationType,
        warningNumber: parseInt(warningNumber) || 1,
        message: message || "Proctoring Warning Issued",
        snapshotBase64: snapshotBase64 || null,
        confidenceScore: parseFloat(confidenceScore) || null,
      }
    });

    const maxWarnings = attempt.test.maxProctoringWarnings || 5;
    const shouldAutoSubmit = violation.warningNumber >= maxWarnings;

    return NextResponse.json({
      success: true,
      violationId: violation.id,
      warningNumber: violation.warningNumber,
      maxWarnings,
      shouldAutoSubmit
    });
  } catch (error) {
    console.error("Error logging proctoring violation:", error);
    return NextResponse.json({ error: "Failed to record proctoring log" }, { status: 500 });
  }
}
