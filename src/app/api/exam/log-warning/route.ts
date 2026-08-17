import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const attemptId = formData.get("attemptId") as string;
    const warningType = formData.get("warningType") as string; // EYE_SLIP, AUDIO_NOISE
    const message = formData.get("message") as string;
    const file = formData.get("file") as Blob | null;

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

    let mediaUrl: string | null = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = path.join(process.cwd(), "public", "uploads", "proctoring_clips");
      await mkdir(uploadsDir, { recursive: true });

      const fileName = `${attemptId}_${warningType.toLowerCase()}_${Date.now()}.webm`;
      const filePath = path.join(uploadsDir, fileName);
      await writeFile(filePath, buffer);

      mediaUrl = `/uploads/proctoring_clips/${fileName}`;
    }

    const warningLog = await prisma.proctoringWarningLog.create({
      data: {
        studentId: attempt.studentId,
        testId: attempt.testId,
        attemptId: attemptId,
        warningType: warningType,
        message: message || (warningType === "EYE_SLIP" ? "Looking away / Face absence warning" : "Microphone audio noise detected warning"),
        mediaUrl: mediaUrl
      }
    });

    return NextResponse.json({ success: true, warningLog });
  } catch (error) {
    console.error("Error logging proctoring warning:", error);
    return NextResponse.json({ error: "Failed to log warning" }, { status: 500 });
  }
}
