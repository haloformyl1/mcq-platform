import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateStudentAttempts } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

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

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { email: true, name: true }
    });

    const availableTests = await prisma.test.findMany({
      where: { 
        status: { in: ["PUBLISHED", "LOCKED"] }
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
        lockAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Apply per-student overrides: prefer any StudentTestOverride for this student & test
    const overrides = await prisma.studentTestOverride.findMany({ where: { studentId } });
    const overridesMap: Record<string, any> = {};
    overrides.forEach(o => {
      overridesMap[o.testId] = o;
    });

    const availableTestsWithOverrides = availableTests.map(t => {
      const o = overridesMap[t.id];
      if (!o) return t;
      return {
        ...t,
        unlockAt: o.overrideUnlockAt ?? t.unlockAt,
        lockAt: o.overrideLockAt ?? t.lockAt
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
    
    // We can compute subject performance on the client, but fetching all answers for all attempts is heavy.
    // For now, let's fetch question categories for the attempts if we want, but let's stick to this base data first.
    
    return NextResponse.json({
      student,
      availableTests: availableTestsWithOverrides,
      allAttempts
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
