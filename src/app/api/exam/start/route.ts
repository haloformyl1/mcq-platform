import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export const dynamic = 'force-dynamic';
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { testId } = await req.json();
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = await decrypt(session!);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { orderIndex: "asc" } } }
    });

    if (!test || (test.status !== "PUBLISHED" && test.status !== "LOCKED")) {
      return NextResponse.json({ error: "Test not available" }, { status: 400 });
    }

    // Check if already attempted
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: { testId, studentId: payload.id as string }
    });

    if (existingAttempt && existingAttempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "Test already submitted" }, { status: 400 });
    }

    const serverTime = new Date();

    if (test.status === "LOCKED" && !existingAttempt) {
      if (test.unlockAt && serverTime < new Date(test.unlockAt)) {
        return NextResponse.json({ error: "Test has not opened yet" }, { status: 403 });
      }
      if (test.lockAt && serverTime >= new Date(test.lockAt)) {
        return NextResponse.json({ error: "New attempts for this test are no longer accepted." }, { status: 403 });
      }
    }

    let attemptId = existingAttempt?.id;

    if (!existingAttempt) {
      const newAttempt = await prisma.testAttempt.create({
        data: {
          testId,
          studentId: payload.id as string,
          status: "IN_PROGRESS",
        }
      });
      attemptId = newAttempt.id;
    }

    let displayQuestions = test.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      imageUrl: q.imageUrl,
    }));

    if (test.randomizeQuestions) {
      displayQuestions = displayQuestions.sort(() => Math.random() - 0.5);
    }
    const endTime = new Date(existingAttempt ? existingAttempt.startedAt.getTime() + test.durationMinutes * 60000 : serverTime.getTime() + test.durationMinutes * 60000);

    return NextResponse.json({
      attemptId,
      test: {
        title: test.title,
        durationMinutes: test.durationMinutes,
        totalQuestions: test.totalQuestions,
      },
      questions: displayQuestions,
      serverTime: serverTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to start test" }, { status: 500 });
  }
}
