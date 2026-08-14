import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateTestAttempts } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const data = await req.json();
    const question = await prisma.question.update({
      where: { id: params.id },
      data: {
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        difficulty: data.difficulty,
        category: data.category,
        orderIndex: data.orderIndex,
      },
    });

    // Automatically recalculate scores for all submitted student attempts of this test
    const scrutinyResult = await recalculateTestAttempts(question.testId);

    return NextResponse.json({
      question,
      totalAttempts: scrutinyResult.totalAttempts,
      updatedAttempts: scrutinyResult.updatedAttempts
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      select: { testId: true }
    });

    await prisma.question.delete({ where: { id: params.id } });

    if (question) {
      await recalculateTestAttempts(question.testId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
