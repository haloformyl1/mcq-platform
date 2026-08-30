import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateAttemptScore } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await recalculateAttemptScore(params.id);

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        test: {
          select: {
            id: true,
            title: true,
            totalQuestions: true,
            marksPerQuestion: true,
            negativeMarking: true,
            negativeMarks: true,
            durationMinutes: true,
            questions: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

    // Map existing answers by questionId
    const existingAnswersMap = new Map<string, Record<string, unknown>>();
    attempt.answers.forEach((ans) => {
      existingAnswersMap.set(ans.questionId, ans);
    });

    const hasSnapshot = Boolean(
      attempt.previousAnswersSnapshot &&
      typeof attempt.previousAnswersSnapshot === "object" &&
      Object.keys(attempt.previousAnswersSnapshot).length > 0
    );
    const snapshot = (attempt.previousAnswersSnapshot as Record<string, string> | null) || {};

    // Build complete answer list containing all test questions (including unattempted ones)
    const allAnswers = attempt.test.questions.map((question) => {
      const existing = existingAnswersMap.get(question.id);
      if (existing) {
        let prevChoice: string | null = (existing.previousAnswer as string) || null;
        let isChanged = Boolean(existing.isChangedInResume);
        let isFresh = Boolean(existing.isFreshInResume);

        if (hasSnapshot) {
          const wasInSnapshot = question.id in snapshot;
          const snapChoice = snapshot[question.id] || null;

          if (wasInSnapshot && snapChoice) {
            prevChoice = snapChoice;
            isChanged = existing.selectedAnswer !== snapChoice;
            isFresh = false;
          } else if (!wasInSnapshot && existing.selectedAnswer) {
            isFresh = true;
            isChanged = false;
            prevChoice = null;
          }
        }

        return {
          ...existing,
          previousAnswer: prevChoice,
          isChangedInResume: isChanged,
          isFreshInResume: isFresh
        };
      }
      return {
        id: `unanswered_${question.id}`,
        attemptId: attempt.id,
        questionId: question.id,
        selectedAnswer: null,
        isCorrect: false,
        answeredAt: null,
        previousAnswer: null,
        isChangedInResume: false,
        isFreshInResume: false,
        question: question
      };
    });

    // Order answers matching student attempt question sequence
    const savedOrder = (attempt.questionOrder as string[] | null) || ((attempt.questionShufflings as any)?._questionOrder as string[] | null);
    if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
      const orderMap = new Map(savedOrder.map((id, idx) => [id, idx]));
      allAnswers.sort((a, b) => {
        const qIdA = (a as any).questionId || "";
        const idxA = orderMap.has(qIdA) ? orderMap.get(qIdA)! : 999999;
        const qIdB = (b as any).questionId || "";
        const idxB = orderMap.has(qIdB) ? orderMap.get(qIdB)! : 999999;
        return idxA - idxB;
      });
    }

    const { test, ...attemptData } = attempt;

    return NextResponse.json({
      ...attemptData,
      test: {
        id: test.id,
        title: test.title,
        totalQuestions: test.totalQuestions,
        marksPerQuestion: test.marksPerQuestion,
        negativeMarking: test.negativeMarking,
        negativeMarks: test.negativeMarks,
        durationMinutes: test.durationMinutes
      },
      answers: allAnswers
    });
  } catch (error) {
    console.error("Admin fetch result error:", error);
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Delete test attempt. Cascade rules clean up connected Answers and Proctoring Warning logs automatically.
    await prisma.testAttempt.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: "Test record deleted successfully everywhere." });
  } catch (error) {
    console.error("Delete test attempt error:", error);
    return NextResponse.json({ error: "Failed to delete test record" }, { status: 500 });
  }
}
