import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { autoExpireSubscriptions } from "@/lib/subscription";

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

    await autoExpireSubscriptions();
    // Check Subscription Limit for FREE students (Lifetime max 2 tests)
    const isPaidSubscriber = student.subscriptionStatus === "PAID" || student.subscriptionStatus === "COMPLIMENTARY";
    if (!isPaidSubscriber) {
      const totalSubmittedAttempts = await prisma.testAttempt.count({
        where: { studentId: student.id, status: "SUBMITTED" }
      });
      const activeAttemptForThisTest = await prisma.testAttempt.findFirst({
        where: { testId, studentId: student.id, status: "IN_PROGRESS" }
      });

      if (totalSubmittedAttempts >= 2 && !activeAttemptForThisTest) {
        return NextResponse.json({ 
          error: "Free Limit Reached! You have completed 2 free tests. Please upgrade to a Paid Subscription to unlock unlimited test access.",
          requiresSubscription: true 
        }, { status: 403 });
      }
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

    const isScheduleExpiredActive = test.status === "SCHEDULE_EXPIRED" && (!test.lockAt || new Date() < new Date(test.lockAt));

    if (test.status !== "LIVE" && test.status !== "PUBLISHED" && test.status !== "UPCOMING" && test.status !== "LOCKED" && !isScheduleExpiredActive && !override) {
      return NextResponse.json({ error: "Test not available" }, { status: 400 });
    }

    // Check for an active IN_PROGRESS attempt
    const activeAttempt = await prisma.testAttempt.findFirst({
      where: { testId, studentId: student.id, status: "IN_PROGRESS" },
      include: { answers: true }
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

    if (!activeAttempt && !override) {
      if (test.status === "UPCOMING" || test.status === "LOCKED") {
        if (effectiveUnlockAt && serverTime < new Date(effectiveUnlockAt)) {
          return NextResponse.json({ error: "Test has not opened yet" }, { status: 403 });
        }
        if (effectiveLockAt && serverTime >= new Date(effectiveLockAt)) {
          const holdMinutes = test.postLockHoldMinutes ?? 4320;
          const autoLiveDate = new Date(new Date(effectiveLockAt).getTime() + holdMinutes * 60 * 1000);
          if (serverTime < autoLiveDate) {
            return NextResponse.json({ error: "New attempts for this test are currently locked." }, { status: 403 });
          }
        }
      } else if (test.status === "SCHEDULE_EXPIRED") {
        if (effectiveLockAt && serverTime >= new Date(effectiveLockAt)) {
          return NextResponse.json({ error: "This scheduled test has expired." }, { status: 403 });
        }
      }
    }

    let attemptId: string;
    let endTime: Date;
    const savedAnswers: Record<string, string> = {};

    let displayQuestions = test.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      imageUrl: q.imageUrl,
    }));

    const existingShufflings = activeAttempt?.questionShufflings as Record<string, any> | null;
    const existingQuestionOrder = (activeAttempt?.questionOrder as string[] | null) || (existingShufflings?._questionOrder as string[] | null);

    if (activeAttempt) {
      attemptId = activeAttempt.id;

      // Calculate remaining time precisely from where student left off
      const totalAllowedSeconds = (test.durationMinutes + (activeAttempt.extraTimeMinutes || 0)) * 60;
      const timeSpentSoFar = activeAttempt.timeSpentSeconds || 0;
      const remainingSeconds = Math.max(10, totalAllowedSeconds - timeSpentSoFar);
      endTime = new Date(serverTime.getTime() + remainingSeconds * 1000);

      // Load already selected answers and guarantee previous answers snapshot is stored
      let snapshotToSave: Record<string, string> | null = null;
      if (!activeAttempt.previousAnswersSnapshot) {
        snapshotToSave = {};
      }

      activeAttempt.answers.forEach(a => {
        if (a.selectedAnswer) {
          savedAnswers[a.questionId] = a.selectedAnswer;
          if (snapshotToSave) {
            snapshotToSave[a.questionId] = a.selectedAnswer;
          }
        }
      });

      // Preserve existing question order if already established
      let questionOrder = existingQuestionOrder;
      if (questionOrder && Array.isArray(questionOrder) && questionOrder.length > 0) {
        const orderMap = new Map(questionOrder.map((id, idx) => [id, idx]));
        displayQuestions.sort((a, b) => {
          const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
          const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
          return idxA - idxB;
        });
      } else {
        // Fallback for attempts that did not have questionOrder saved
        if (test.randomizeQuestions) {
          for (let i = displayQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [displayQuestions[i], displayQuestions[j]] = [displayQuestions[j], displayQuestions[i]];
          }
        }
        questionOrder = displayQuestions.map(q => q.id);
        await prisma.testAttempt.update({
          where: { id: activeAttempt.id },
          data: { questionOrder }
        });
      }

      // Preserve existing option shuffling
      if (existingShufflings && Object.keys(existingShufflings).length > 0) {
        displayQuestions = displayQuestions.map(q => {
          if (existingShufflings[q.id]) {
            const mapping = existingShufflings[q.id];
            const origOptions: Record<string, string> = {
              "A": q.optionA,
              "B": q.optionB,
              "C": q.optionC,
              "D": q.optionD,
            };
            return {
              ...q,
              optionA: origOptions[mapping["A"]] || q.optionA,
              optionB: origOptions[mapping["B"]] || q.optionB,
              optionC: origOptions[mapping["C"]] || q.optionC,
              optionD: origOptions[mapping["D"]] || q.optionD,
            };
          }
          return q;
        });
      }

      // Record when this resume session started and guarantee snapshot is frozen
      await prisma.testAttempt.update({
        where: { id: activeAttempt.id },
        data: {
          resumedAt: serverTime,
          ...(snapshotToSave ? { previousAnswersSnapshot: snapshotToSave } : {})
        }
      });
    } else {
      // New Attempt: establish deterministic question order
      if (test.randomizeQuestions) {
        for (let i = displayQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [displayQuestions[i], displayQuestions[j]] = [displayQuestions[j], displayQuestions[i]];
        }
      }
      const questionOrder = displayQuestions.map(q => q.id);
      const questionShufflings: Record<string, any> = {
        _questionOrder: questionOrder,
      };

      // Shuffle options for each question if enabled
      if (test.randomizeOptions) {
        const options = ["A", "B", "C", "D"];
        
        displayQuestions = displayQuestions.map(q => {
          const optionPairs: [string, string][] = [
            ["A", q.optionA],
            ["B", q.optionB],
            ["C", q.optionC],
            ["D", q.optionD],
          ];

          for (let i = optionPairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionPairs[i], optionPairs[j]] = [optionPairs[j], optionPairs[i]];
          }

          const mapping: Record<string, string> = {};
          optionPairs.forEach((pair, idx) => {
            mapping[options[idx]] = pair[0];
          });

          questionShufflings[q.id] = mapping;

          return {
            ...q,
            optionA: optionPairs[0][1],
            optionB: optionPairs[1][1],
            optionC: optionPairs[2][1],
            optionD: optionPairs[3][1],
          };
        });
      }

      const newAttempt = await prisma.testAttempt.create({
        data: {
          testId,
          studentId: student.id,
          status: "IN_PROGRESS",
          attemptNumber: attemptsUsed + 1,
          resumedAt: serverTime,
          questionOrder,
          questionShufflings: Object.keys(questionShufflings).length > 0 ? questionShufflings : undefined,
        }
      });
      attemptId = newAttempt.id;
      endTime = new Date(serverTime.getTime() + test.durationMinutes * 60000);
    }

    return NextResponse.json({
      attemptId,
      test: {
        title: test.title,
        durationMinutes: test.durationMinutes,
        totalQuestions: test.totalQuestions,
      },
      questions: displayQuestions,
      savedAnswers,
      serverTime: serverTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  } catch (error) {
    console.error("Start test error:", error);
    return NextResponse.json({ error: "Failed to start test" }, { status: 500 });
  }
}
