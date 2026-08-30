import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  const params = await context.params;
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

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        test: {
          include: {
            questions: { orderBy: { orderIndex: "asc" } }
          }
        },
        answers: true
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.studentId !== payload.id) {
      return NextResponse.json({ error: "Unauthorized access to this test" }, { status: 403 });
    }

    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({
        isSubmitted: true,
        status: "SUBMITTED",
        attemptId: attempt.id
      });
    }

    const test = attempt.test;
    const totalAllowedSeconds = (test.durationMinutes + (attempt.extraTimeMinutes || 0)) * 60;
    const timeSpentSoFar = attempt.timeSpentSeconds || 0;
    let remainingSeconds = Math.max(10, totalAllowedSeconds - timeSpentSoFar);

    const now = new Date();

    let snapshotToSave: Record<string, string> | null = null;
    if (!attempt.previousAnswersSnapshot && (attempt.timeSpentSeconds || 0) > 0) {
      snapshotToSave = {};
      attempt.answers.forEach(a => {
        if (a.selectedAnswer) snapshotToSave![a.questionId] = a.selectedAnswer;
      });
    }

    if (attempt.resumedAt) {
      const elapsedSinceResume = Math.max(0, Math.floor((now.getTime() - new Date(attempt.resumedAt).getTime()) / 1000));
      remainingSeconds = Math.max(5, remainingSeconds - elapsedSinceResume);
      if (snapshotToSave) {
        await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: { previousAnswersSnapshot: snapshotToSave }
        });
      }
    } else {
      // First session entry after start/reopen
      await prisma.testAttempt.update({
        where: { id: attempt.id },
        data: {
          resumedAt: now,
          ...(snapshotToSave ? { previousAnswersSnapshot: snapshotToSave } : {})
        }
      });
    }

    const endTime = new Date(now.getTime() + remainingSeconds * 1000);

    // Reconstruct display questions respecting option shuffling if present
    const shufflings = attempt.questionShufflings as Record<string, Record<string, string>> | null;

    const displayQuestions = test.questions.map(q => {
      let optionA = q.optionA;
      let optionB = q.optionB;
      let optionC = q.optionC;
      let optionD = q.optionD;

      if (shufflings && shufflings[q.id]) {
        const mapping = shufflings[q.id]; // mapping: { "A": originalLetter, ... }
        const origOptions: Record<string, string> = {
          "A": q.optionA,
          "B": q.optionB,
          "C": q.optionC,
          "D": q.optionD
        };
        optionA = origOptions[mapping["A"]] || q.optionA;
        optionB = origOptions[mapping["B"]] || q.optionB;
        optionC = origOptions[mapping["C"]] || q.optionC;
        optionD = origOptions[mapping["D"]] || q.optionD;
      }

      return {
        id: q.id,
        questionText: q.questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        imageUrl: q.imageUrl
      };
    });

    const savedAnswers: Record<string, string> = {};
    attempt.answers.forEach(a => {
      if (a.selectedAnswer) {
        savedAnswers[a.questionId] = a.selectedAnswer;
      }
    });

    return NextResponse.json({
      attemptId: attempt.id,
      test: {
        title: test.title,
        durationMinutes: test.durationMinutes,
        totalQuestions: test.totalQuestions
      },
      questions: displayQuestions,
      savedAnswers,
      remainingSeconds,
      serverTime: now.toISOString(),
      endTime: endTime.toISOString()
    });
  } catch (error) {
    console.error("Exam session fetch error:", error);
    return NextResponse.json({ error: "Failed to load exam session" }, { status: 500 });
  }
}
