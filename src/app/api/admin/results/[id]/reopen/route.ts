import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;
  const payload = adminSession ? await decrypt(adminSession) : null;
  return payload && payload.role === "admin";
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        test: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            totalQuestions: true
          }
        },
        answers: {
          select: { questionId: true, selectedAnswer: true }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const totalDurationSeconds = (attempt.test.durationMinutes + (attempt.extraTimeMinutes || 0)) * 60;
    let timeSpentSeconds = attempt.timeSpentSeconds || 0;
    if (timeSpentSeconds === 0 && attempt.submittedAt && attempt.startedAt) {
      const diff = Math.floor((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000);
      timeSpentSeconds = Math.min(Math.max(0, diff), totalDurationSeconds);
    }

    const remainingSeconds = Math.max(0, totalDurationSeconds - timeSpentSeconds);
    const answeredCount = attempt.answers.filter(a => !!a.selectedAnswer).length;

    return NextResponse.json({
      id: attempt.id,
      student: {
        id: attempt.student.id,
        name: attempt.student.name || (attempt.student.email ? attempt.student.email.split("@")[0] : "Student"),
        email: attempt.student.email
      },
      test: attempt.test,
      status: attempt.status,
      submissionReason: attempt.submissionReason,
      timeSpentSeconds,
      remainingSeconds,
      totalDurationSeconds,
      answeredCount,
      extraTimeMinutes: attempt.extraTimeMinutes || 0
    });
  } catch (error) {
    console.error("Fetch reopen details error:", error);
    return NextResponse.json({ error: "Failed to fetch attempt details" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let extraMinutes = 0;
    try {
      const body = await req.json();
      if (body && typeof body.extraMinutes === "number") {
        extraMinutes = Math.max(0, Math.floor(body.extraMinutes));
      }
    } catch {
      // Empty body is acceptable
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
      include: {
        test: {
          select: {
            id: true,
            durationMinutes: true
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const totalDurationSeconds = (attempt.test.durationMinutes + (attempt.extraTimeMinutes || 0)) * 60;
    let timeSpent = attempt.timeSpentSeconds || 0;
    if (timeSpent === 0 && attempt.submittedAt && attempt.startedAt) {
      const diff = Math.floor((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000);
      timeSpent = Math.min(Math.max(0, diff), totalDurationSeconds);
    }

    const currentRemaining = Math.max(0, totalDurationSeconds - timeSpent);
    let finalExtraMinutes = (attempt.extraTimeMinutes || 0) + extraMinutes;
    // If the test time was completely exhausted and no extra time was set, grant 5 minutes grace by default
    if (currentRemaining <= 0 && extraMinutes <= 0) {
      finalExtraMinutes += 5;
    }

    // Capture snapshot of all answers currently selected before reopening
    const existingAnswers = await prisma.answer.findMany({
      where: { attemptId: params.id }
    });

    const previousAnswersSnapshot: Record<string, string> = {};
    for (const a of existingAnswers) {
      if (a.selectedAnswer) {
        previousAnswersSnapshot[a.questionId] = a.selectedAnswer;
        await prisma.answer.update({
          where: { id: a.id },
          data: {
            previousAnswer: a.selectedAnswer,
            isChangedInResume: false,
            isFreshInResume: false
          }
        });
      }
    }

    const updated = await prisma.testAttempt.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        submissionReason: null,
        submittedAt: null,
        resumedAt: null,
        timeSpentSeconds: timeSpent,
        extraTimeMinutes: finalExtraMinutes,
        previousAnswersSnapshot: previousAnswersSnapshot as Record<string, string>,
        score: null,
        percentage: null,
        correctCount: null,
        incorrectCount: null,
        unansweredCount: null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Test has been reopened for the student. The timer will resume from where it stopped.",
      attempt: updated
    });
  } catch (error) {
    console.error("Reopen attempt error:", error);
    return NextResponse.json({ error: "Failed to reopen test attempt" }, { status: 500 });
  }
}
