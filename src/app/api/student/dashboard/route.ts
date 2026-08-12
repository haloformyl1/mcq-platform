import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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
      availableTests,
      allAttempts
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
