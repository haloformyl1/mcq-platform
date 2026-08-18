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

    const questionNumberRaw = formData.get("questionNumber") as string | null;
    const questionText = (formData.get("questionText") as string | null) || null;
    const questionNumber = questionNumberRaw ? parseInt(questionNumberRaw, 10) : null;

    let mediaUrl: string | null = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${attemptId}_${warningType.toLowerCase()}_${Date.now()}`;

      // 1. Try uploading to Cloudinary (Vercel CDN compatible)
      const { uploadToCloudinary } = await import("@/lib/cloudinary");
      const cloudinaryUrl = await uploadToCloudinary(buffer, "proctoring_clips", "video", fileName);

      if (cloudinaryUrl) {
        // Ensure cloud video URL ends with .mp4 for universal HTML5 browser playback
        mediaUrl = cloudinaryUrl.endsWith(".mp4") || cloudinaryUrl.endsWith(".webm") 
          ? cloudinaryUrl 
          : `${cloudinaryUrl}.mp4`;
      } else {
        // 2. Fallback to local disk storage
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "proctoring_clips");
        await mkdir(uploadsDir, { recursive: true });

        const localFileName = `${fileName}.webm`;
        const filePath = path.join(uploadsDir, localFileName);
        await writeFile(filePath, buffer);

        mediaUrl = `/uploads/proctoring_clips/${localFileName}`;
      }
    }

    const warningLog = await prisma.proctoringWarningLog.create({
      data: {
        studentId: attempt.studentId,
        testId: attempt.testId,
        attemptId: attemptId,
        warningType: warningType,
        message: message || (warningType === "EYE_SLIP" ? "Looking away / Face absence warning" : "Microphone audio noise detected warning"),
        mediaUrl: mediaUrl,
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
