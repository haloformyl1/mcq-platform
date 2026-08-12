import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    });
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const test = await prisma.test.create({
      data: {
        title: data.title,
        description: data.description,
        durationMinutes: parseInt(data.durationMinutes),
        totalQuestions: parseInt(data.totalQuestions) || 50,
        marksPerQuestion: parseFloat(data.marksPerQuestion) || 1,
        negativeMarking: data.negativeMarking || false,
        negativeMarks: parseFloat(data.negativeMarks) || 0,
        randomizeQuestions: data.randomizeQuestions || false,
        randomizeOptions: data.randomizeOptions || false,
      },
    });
    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 });
  }
}
