import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: { _count: { select: { questions: true } } },
    });

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    if (test._count.questions >= test.totalQuestions) {
      return NextResponse.json({ error: `Maximum ${test.totalQuestions} questions allowed per test.` }, { status: 400 });
    }

    const data = await req.json();
    const question = await prisma.question.create({
      data: {
        testId: params.id,
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        difficulty: data.difficulty,
        category: data.category,
        orderIndex: data.orderIndex || test._count.questions,
      },
    });
    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}
