import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateAttemptScore } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await recalculateAttemptScore(params.id);

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { email: true } },
        test: { select: { title: true } },
        answers: {
          include: {
            question: true
          }
        }
      }
    });
    if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(attempt);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}
