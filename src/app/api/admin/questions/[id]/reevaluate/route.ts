import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateTestAttempts } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      select: { testId: true, questionText: true }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const result = await recalculateTestAttempts(question.testId);

    return NextResponse.json({
      success: true,
      totalAttempts: result.totalAttempts,
      updatedAttempts: result.updatedAttempts,
      message: `Scrutiny complete! Re-evaluated ${result.totalAttempts} student attempt(s). ${result.updatedAttempts} student score(s) updated within seconds.`
    });
  } catch (error) {
    console.error("Re-evaluation error:", error);
    return NextResponse.json({ error: "Failed to re-evaluate student scores" }, { status: 500 });
  }
}
