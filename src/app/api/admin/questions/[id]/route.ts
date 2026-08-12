import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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
    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await prisma.question.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
