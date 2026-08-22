import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateStudentAttempts } from "@/lib/recalculate";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

function isRealStudent(student: { email: string; name?: string | null }) {
  if (!student || !student.email) return false;
  const emailLower = student.email.toLowerCase();
  if (emailLower.endsWith('@student.local') || emailLower.includes('admin.test')) return false;
  if (student.name && student.name.toLowerCase().includes('admin test')) return false;
  return true;
}

export async function GET(req: Request) {
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

    const studentId = payload.id;

    // Recalculate all submitted attempts for this student to guarantee latest scores
    await recalculateStudentAttempts(studentId);

    const student = await prisma.student.update({
      where: { id: studentId },
      data: { lastLogin: new Date() },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        phone: true, 
        gender: true, 
        dob: true, 
        board: true, 
        academicLevel: true, 
        status: true,
        subscriptionStatus: true,
        avatarUrl: true,
        createdAt: true 
      }
    });

    const availableTests = await prisma.test.findMany({
      where: { 
        status: { in: ["LIVE", "UPCOMING", "PUBLISHED", "LOCKED", "EXPIRED", "SCHEDULE_EXPIRED"] }
      },
      select: {
        id: true,
        title: true,
        totalQuestions: true,
        durationMinutes: true,
        marksPerQuestion: true,
        negativeMarking: true,
        negativeMarks: true,
        status: true,
        unlockAt: true,
        lockAt: true,
        postLockHoldMinutes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Apply per-student overrides: prefer any StudentTestOverride for this student & test
    const overrides = await prisma.studentTestOverride.findMany({ where: { studentId } });
    const overridesMap: Record<string, any> = {};
    overrides.forEach(o => {
      overridesMap[o.testId] = o;
    });

    // Fetch access requests made by this student
    const requests = await prisma.testAccessRequest.findMany({ where: { studentId } });
    const requestsMap: Record<string, any> = {};
    requests.forEach(r => {
      requestsMap[r.testId] = r;
    });

    const availableTestsWithOverrides = availableTests.map(t => {
      const o = overridesMap[t.id];
      const r = requestsMap[t.id];
      const base = o ? {
        ...t,
        unlockAt: (o.overrideUnlockAt !== null && o.overrideUnlockAt !== undefined) ? o.overrideUnlockAt : t.unlockAt,
        lockAt: (o.overrideLockAt !== null && o.overrideLockAt !== undefined) ? o.overrideLockAt : t.lockAt
      } : t;
      return {
        ...base,
        hasIndividualAccess: !!o,
        userRequestStatus: r ? r.status : null
      };
    });

    const allAttempts = await prisma.testAttempt.findMany({
      where: { studentId },
      include: {
        test: {
          select: { title: true, totalQuestions: true }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // Fetch Top 2 Students of the Last Submitted Exam (Excluding Admin Test Student)
    let lastExamTopStudents: any[] = [];
    let lastExamTitle = "";

    const recentAttempt = await prisma.testAttempt.findFirst({
      where: {
        status: "SUBMITTED",
        student: {
          NOT: [
            { email: { endsWith: "@student.local" } },
            { email: { contains: "admin.test" } }
          ]
        }
      },
      orderBy: [
        { submittedAt: 'desc' },
        { startedAt: 'desc' }
      ],
      select: { testId: true, test: { select: { title: true } } }
    });

    if (recentAttempt) {
      lastExamTitle = recentAttempt.test.title;
      
      const testAttempts = await prisma.testAttempt.findMany({
        where: {
          testId: recentAttempt.testId,
          status: "SUBMITTED",
          student: {
            NOT: [
              { email: { endsWith: "@student.local" } },
              { email: { contains: "admin.test" } }
            ]
          }
        },
        include: {
          student: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      const studentMap = new Map<string, any>();

      for (const att of testAttempts) {
        if (!att.student || !isRealStudent(att.student)) continue;

        const existing = studentMap.get(att.studentId);
        if (!existing || (att.score || 0) > (existing.score || 0)) {
          // Calculate student's overall accuracy across all submitted attempts
          const allStudentAttempts = await prisma.testAttempt.findMany({
            where: { studentId: att.studentId, status: "SUBMITTED" },
            select: { correctCount: true, incorrectCount: true, percentage: true }
          });

          let totalCorrect = 0;
          let totalAnswered = 0;
          let totalPercentageSum = 0;

          allStudentAttempts.forEach(a => {
            totalCorrect += a.correctCount || 0;
            totalAnswered += (a.correctCount || 0) + (a.incorrectCount || 0);
            totalPercentageSum += a.percentage || 0;
          });

          const avgAccuracy = totalAnswered > 0
            ? (totalCorrect / totalAnswered) * 100
            : (allStudentAttempts.length > 0 ? totalPercentageSum / allStudentAttempts.length : (att.percentage || 0));

          const displayName = att.student.name || att.student.email.split('@')[0];

          // Completion time in seconds
          const startMs = new Date(att.startedAt).getTime();
          const submitMs = att.submittedAt ? new Date(att.submittedAt).getTime() : startMs;
          const durationSeconds = Math.max(0, Math.floor((submitMs - startMs) / 1000));

          studentMap.set(att.studentId, {
            studentId: att.studentId,
            name: displayName,
            score: att.score || 0,
            percentage: att.percentage || 0,
            accuracy: Number(avgAccuracy.toFixed(1)),
            durationSeconds
          });
        }
      }

      // Sort by score desc, then by accuracy desc, then by faster completion time asc
      const sorted = Array.from(studentMap.values()).sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (b.accuracy !== a.accuracy) {
          return b.accuracy - a.accuracy;
        }
        // Tie-breaker: Faster test completion time (fewer seconds taken) wins!
        return a.durationSeconds - b.durationSeconds;
      });

      lastExamTopStudents = sorted.slice(0, 2).map((st, idx) => ({
        rank: idx + 1,
        name: st.name,
        score: st.score,
        percentage: st.percentage,
        accuracy: st.accuracy
      }));
    }
    
    let testAlertSettings = await prisma.testAlertSetting.findUnique({
      where: { id: "default" }
    });

    if (!testAlertSettings) {
      testAlertSettings = {
        id: "default",
        badgeText: "TEST ALERT",
        bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
        badgeColor: "bg-amber-500 text-black",
        textColor: "text-amber-200",
        marqueeSpeed: "normal",
        customNotice: "",
        updatedAt: new Date()
      };
    }

    return NextResponse.json({
      student,
      availableTests: availableTestsWithOverrides,
      testAlertSettings,
      allAttempts,
      lastExamTopStudents,
      lastExamTitle
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
