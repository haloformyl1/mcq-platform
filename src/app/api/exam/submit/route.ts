import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { attemptId, reason = "MANUAL_SUBMISSION" } = await req.json();
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = await decrypt(session!);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: { include: { questions: true } },
        answers: true
      }
    });

    if (!attempt || attempt.studentId !== payload.id) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
    }

    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({ success: true, message: "Already submitted" });
    }

    // Calculate score
    const test = attempt.test;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = test.questions.length;
    let score = 0;

    const answersDict = attempt.answers.reduce((acc, ans) => {
      acc[ans.questionId] = ans;
      return acc;
    }, {} as Record<string, any>);

    for (const question of test.questions) {
      const answer = answersDict[question.id];
      if (answer && answer.selectedAnswer) {
        unansweredCount--;
        const isCorrect = answer.selectedAnswer === question.correctAnswer;
        
        await prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect }
        });

        if (isCorrect) {
          correctCount++;
          score += test.marksPerQuestion;
        } else {
          incorrectCount++;
          if (test.negativeMarking) {
            score -= test.negativeMarks;
          }
        }
      }
    }

    const percentage = test.questions.length > 0 ? (score / (test.questions.length * test.marksPerQuestion)) * 100 : 0;

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submissionReason: reason,
        score,
        percentage,
        correctCount,
        incorrectCount,
        unansweredCount,
      }
    });

    return NextResponse.json({ success: true, result: updatedAttempt });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit test" }, { status: 500 });
  }
}
