import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const attemptId = formData.get("attemptId") as string;
    const warningType = formData.get("warningType") as string;
    const message = formData.get("message") as string;

    if (!attemptId || !warningType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: { studentId: true, testId: true }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const questionNumberRaw = formData.get("questionNumber") as string | null;
    const questionText = (formData.get("questionText") as string | null) || null;
    const questionNumber = questionNumberRaw ? parseInt(questionNumberRaw, 10) : null;

    const warningLog = await prisma.proctoringWarningLog.create({
      data: {
        studentId: attempt.studentId,
        testId: attempt.testId,
        attemptId: attemptId,
        warningType: warningType,
        message: message || "Security warning",
        mediaUrl: null,
        questionNumber: questionNumber,
        questionText: questionText
      }
    });

    return NextResponse.json({ success: true, warningLog });
  } catch (error) {
    console.error("Error logging proctoring warning:", error);
    return NextResponse.json({ error: "Failed to log warning" }, { status: 500 });
  }
}
