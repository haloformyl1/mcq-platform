import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateTestAttempts } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

// Next.js 15 requires awaiting params
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
    if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const data = await req.json();

    let status = data.status;
    let unlockAt = data.unlockAt ? new Date(data.unlockAt) : null;
    let lockAt = data.lockAt ? new Date(data.lockAt) : null;

    if (status === "LIVE" || status === "PUBLISHED") {
      unlockAt = null;
      lockAt = null;
    } else if (status === "UPCOMING" || status === "LOCKED") {
      if (!unlockAt) {
        return NextResponse.json({ error: "Unlock Date & Time is required for UPCOMING status." }, { status: 400 });
      }
      if (!lockAt) {
        return NextResponse.json({ error: "Re-Lock Date & Time is required for UPCOMING status." }, { status: 400 });
      }
      if (lockAt <= unlockAt) {
        return NextResponse.json({ error: "Re-Lock Date & Time must be later than Unlock Date & Time." }, { status: 400 });
      }
    }

    const test = await prisma.test.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        durationMinutes: parseInt(data.durationMinutes),
        totalQuestions: parseInt(data.totalQuestions),
        marksPerQuestion: parseFloat(data.marksPerQuestion),
        negativeMarking: data.negativeMarking,
        negativeMarks: parseFloat(data.negativeMarks),
        maximumAttempts: parseInt(data.maximumAttempts) || 1,
        randomizeQuestions: data.randomizeQuestions,
        randomizeOptions: data.randomizeOptions,
        status: status,
        unlockAt: unlockAt,
        lockAt: lockAt,
        postLockHoldMinutes: typeof data.postLockHoldMinutes !== 'undefined' && !isNaN(parseInt(data.postLockHoldMinutes)) ? parseInt(data.postLockHoldMinutes) : 4320,
        aiProctoringEnabled: typeof data.aiProctoringEnabled === 'boolean' ? data.aiProctoringEnabled : true,
        maxProctoringWarnings: parseInt(data.maxProctoringWarnings) || 5,
      },
    });

    await recalculateTestAttempts(params.id);

    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await prisma.test.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 });
  }
}

