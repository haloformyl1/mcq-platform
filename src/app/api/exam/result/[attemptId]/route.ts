import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  const params = await context.params;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = await decrypt(session!);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        test: {
          select: { title: true, totalQuestions: true, marksPerQuestion: true, negativeMarking: true, negativeMarks: true, durationMinutes: true }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!attempt || attempt.studentId !== payload.id) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
    }

    return NextResponse.json(attempt);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}
