import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { attemptId, questionId, selectedAnswer } = await req.json();
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = await decrypt(session!);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.studentId !== payload.id || attempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "Invalid attempt or already submitted" }, { status: 400 });
    }

    const existingAnswer = await prisma.answer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId
        }
      }
    });

    const isResumedSession = Boolean(
      attempt.resumedAt ||
      attempt.previousAnswersSnapshot ||
      (attempt.timeSpentSeconds && attempt.timeSpentSeconds > 0)
    );

    let previousAnswer = existingAnswer?.previousAnswer ?? null;
    let isChangedInResume = existingAnswer?.isChangedInResume ?? false;
    let isFreshInResume = existingAnswer?.isFreshInResume ?? false;

    if (isResumedSession) {
      const snapshot = attempt.previousAnswersSnapshot as Record<string, string> | null;
      if (snapshot && typeof snapshot === "object") {
        const wasInSnapshot = questionId in snapshot;
        const originalChoice = snapshot[questionId] || null;

        if (wasInSnapshot && originalChoice) {
          previousAnswer = originalChoice;
          isChangedInResume = selectedAnswer !== originalChoice;
          isFreshInResume = false;
        } else if (!wasInSnapshot) {
          isFreshInResume = true;
          isChangedInResume = false;
          previousAnswer = null;
        }
      } else if (existingAnswer?.previousAnswer) {
        previousAnswer = existingAnswer.previousAnswer;
        isChangedInResume = selectedAnswer !== previousAnswer;
        isFreshInResume = false;
      }
    }

    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId
        }
      },
      update: {
        selectedAnswer,
        answeredAt: new Date(),
        previousAnswer,
        isChangedInResume,
        isFreshInResume
      },
      create: {
        attemptId,
        questionId,
        selectedAnswer,
        answeredAt: new Date(),
        previousAnswer,
        isChangedInResume,
        isFreshInResume
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
