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
        },
        proctoringViolations: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

    // Map existing answers by questionId
    const existingAnswersMap = new Map<string, any>();
    attempt.answers.forEach((ans) => {
      existingAnswersMap.set(ans.questionId, ans);
    });

    // Build complete answer list containing all test questions (including unattempted ones)
    const allAnswers = attempt.test.questions.map((question) => {
      const existing = existingAnswersMap.get(question.id);
      if (existing) {
        return existing;
      }
      return {
        id: `unanswered_${question.id}`,
        attemptId: attempt.id,
        questionId: question.id,
        selectedAnswer: null,
        isCorrect: false,
        answeredAt: null,
        question: question
      };
    });

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
