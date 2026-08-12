import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { attemptId, questionId, selectedAnswer } = await req.json();
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = await decrypt(session!);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.studentId !== payload.id || attempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "Invalid attempt or already submitted" }, { status: 400 });
    }

    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId
        }
      },
      update: { selectedAnswer, answeredAt: new Date() },
      create: { attemptId, questionId, selectedAnswer }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save answer" }, { status: 500 });
  }
}
