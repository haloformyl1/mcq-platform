import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const student = await prisma.student.findUnique({ where: { id: payload.id as string } });
    if (!student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (student.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended. Please contact the administrator for assistance." }, { status: 403 });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { orderBy: { orderIndex: "asc" } } }
    });

    // Check for student-specific test override
    const override = await prisma.studentTestOverride.findUnique({
      where: {
        studentId_testId: {
          studentId: student.id,
          testId: testId,
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: "Test not available" }, { status: 400 });
    }

    const isScheduleExpiredActive = test.status === "SCHEDULE_EXPIRED" && test.lockAt && new Date() < new Date(test.lockAt);

    if (test.status !== "PUBLISHED" && test.status !== "LOCKED" && !isScheduleExpiredActive && !override) {
      return NextResponse.json({ error: "Test not available" }, { status: 400 });
    }

    // Check for an active IN_PROGRESS attempt
    const activeAttempt = await prisma.testAttempt.findFirst({
      where: { testId, studentId: student.id, status: "IN_PROGRESS" }
    });
    
    // Check for completed attempts to enforce limit
    const latestSubmittedAttempt = await prisma.testAttempt.findFirst({
      where: { testId, studentId: student.id, status: "SUBMITTED" },
      orderBy: { startedAt: "desc" }
    });

    const attemptsUsed = latestSubmittedAttempt ? latestSubmittedAttempt.attemptNumber : 0;

    if (!activeAttempt && attemptsUsed >= test.maximumAttempts) {
      return NextResponse.json({ error: "Attempt Limit Reached" }, { status: 403 });
    }

    const serverTime = new Date();

    // Prefer student override unlockAt and lockAt if present
    const effectiveUnlockAt = override?.overrideUnlockAt ?? test.unlockAt;
    const effectiveLockAt = override?.overrideLockAt ?? test.lockAt;

    if (!activeAttempt) {
      if (effectiveUnlockAt && serverTime < new Date(effectiveUnlockAt)) {
        return NextResponse.json({ error: "Test has not opened yet" }, { status: 403 });
      }
      if (effectiveLockAt && serverTime >= new Date(effectiveLockAt)) {
        return NextResponse.json({ error: "New attempts for this test are no longer accepted." }, { status: 403 });
      }
    }

    let attemptId = activeAttempt?.id;
    let existingAttemptStartedAt = activeAttempt?.startedAt;

    if (!activeAttempt) {
      const newAttempt = await prisma.testAttempt.create({
        data: {
          testId,
          studentId: student.id,
          status: "IN_PROGRESS",
          attemptNumber: attemptsUsed + 1
        }
      });
      attemptId = newAttempt.id;
      existingAttemptStartedAt = newAttempt.startedAt;
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

    // Track shuffling information for answer validation
    const questionShufflings: Record<string, Record<string, string>> = {};

    if (test.randomizeQuestions) {
      displayQuestions = displayQuestions.sort(() => Math.random() - 0.5);
    }

    // Shuffle options for each question if enabled
    if (test.randomizeOptions) {
      const options = ['A', 'B', 'C', 'D'];
      
      displayQuestions = displayQuestions.map(q => {
        // Create array of [letter, option_text] pairs
        const optionPairs: [string, string][] = [
          ['A', q.optionA],
          ['B', q.optionB],
          ['C', q.optionC],
          ['D', q.optionD],
        ];

        // Shuffle the pairs
        for (let i = optionPairs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [optionPairs[i], optionPairs[j]] = [optionPairs[j], optionPairs[i]];
        }

        // Create mapping: new position -> original letter
        const mapping: Record<string, string> = {};
        optionPairs.forEach((pair, idx) => {
          mapping[options[idx]] = pair[0]; // "A" -> "C" means display position A contains original option C
        });

        questionShufflings[q.id] = mapping;

        // Return question with shuffled options (mapping stored server-side, not sent to client)
        return {
          ...q,
          optionA: optionPairs[0][1],
          optionB: optionPairs[1][1],
          optionC: optionPairs[2][1],
          optionD: optionPairs[3][1],
        };
      });
    }

    const endTime = new Date(existingAttemptStartedAt!.getTime() + test.durationMinutes * 60000);

    // Store shuffling information in attempt if options were shuffled
    if (test.randomizeOptions && Object.keys(questionShufflings).length > 0) {
      await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          questionShufflings: questionShufflings as any,
        }
      });
    }

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
