import { NextRequest, NextResponse } from "next/server";
import { askEducationalTutor } from "@/lib/ai/tutorService";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/ai/rateLimiter";
import { consumeAiQuota, createAiQuotaExceededResponse } from "@/lib/ai/aiQuota";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    // Server-Side Rate Limiting (30 requests / minute)
    const clientId = getClientIdentifier(req, student?.id);
    const rateLimit = checkRateLimit(clientId, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await req.json();
    const userPrompt = body.prompt || body.message;
    const { history, context, mode, level, language, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return NextResponse.json({ error: "Please enter a valid study question." }, { status: 400 });
    }

    // SERVER-SIDE ANTI-CHEATING VERIFICATION:
    let isExamActive = Boolean(context?.isExamActive);
    if (student?.id) {
      const activeAttempt = await prisma.testAttempt.findFirst({
        where: {
          studentId: student.id,
          status: 'IN_PROGRESS'
        }
      });
      if (activeAttempt) {
        isExamActive = true;
      }
    }

    if (isExamActive) {
      const isBengali = language === 'bn';
      const refusal = isBengali
        ? "এই সক্রিয় পরীক্ষা চলাকালীন AI সহায়তা কঠোরভাবে নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে সম্পূর্ণ সততার সাথে আপনার পরীক্ষা সম্পন্ন করুন।"
        : "AI assistance is disabled during this active examination. Please complete your test independently.";

      return NextResponse.json({
        answer: refusal,
        reply: refusal,
        content: refusal,
        model: "PIECHEM Exam Proctor Guard",
        sources: [],
        sourceCategory: 'GENERAL_ACADEMIC',
        groundedInPiechem: false,
        suggestedFollowUps: [],
        activeExamBlocked: true,
        language: language || 'en'
      });
    }

    // DAILY FREE TIER AI QUOTA CHECK
    const quota = await consumeAiQuota(student?.id, userApiKey);
    if (!quota.allowed) {
      return createAiQuotaExceededResponse(quota);
    }

    const mergedContext = {
      ...context,
      studentId: student?.id,
      name: student?.name,
      isExamActive: false
    };

    const result = await askEducationalTutor({
      prompt: userPrompt.trim(),
      history,
      context: mergedContext,
      mode,
      level,
      language,
      userApiKey
    });

    return NextResponse.json({
      ...result,
      reply: result.answer,
      content: result.answer,
      quota: {
        queriesUsed: quota.queriesUsed,
        totalLimit: quota.totalLimit,
        dailyLimit: quota.totalLimit,
        remaining: quota.remaining,
        isUnlimited: quota.isUnlimited
      }
    });
  } catch (err: any) {
    console.error("AI Tutor Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate educational response." },
      { status: 500 }
    );
  }
}
