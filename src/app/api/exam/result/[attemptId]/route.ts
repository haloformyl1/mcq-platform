import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  const params = await context.params;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = await decrypt(session!);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
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

    if (!attempt || attempt.studentId !== payload.id) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
    }

    // Build a map of existing answers by questionId
    const existingAnswersMap = new Map<string, any>();
    attempt.answers.forEach((ans) => {
      existingAnswersMap.set(ans.questionId, ans);
    });

    // Create a complete list of answers containing all questions (including unanswered)
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
    console.error("Fetch result error:", error);
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}
