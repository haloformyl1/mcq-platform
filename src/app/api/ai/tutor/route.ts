import { NextRequest, NextResponse } from "next/server";
import { askEducationalTutor } from "@/lib/ai/tutorService";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/ai/rateLimiter";
import { consumeAiQuota, getAiQuotaStatus, createAiQuotaExceededResponse, getDynamicGoldPrice } from "@/lib/ai/aiQuota";
import { classifySubjectScope } from "@/lib/ai/subjectGate";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    // 1. Server-Side Rate Limiting (30 requests / minute)
    const clientId = getClientIdentifier(req, student?.id);
    const rateLimit = checkRateLimit(clientId, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await req.json();
    const userPrompt = body.prompt || body.message || body.query;
    const { history, context, mode, level, language, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    // 2. Validate Request
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return NextResponse.json({ error: "Please enter a valid study question." }, { status: 400 });
    }

    const trimmedPrompt = userPrompt.trim();

    // 3. Server-Side Anti-Cheating Verification during active exams - REMOVED

    // 4. Pre-check Daily AI Quota (Check without consuming yet)
    const quotaStatus = await getAiQuotaStatus(student?.id);
    const hasCustomKey = Boolean(userApiKey && typeof userApiKey === 'string' && userApiKey.trim().length > 10);
    
    if (!quotaStatus.allowed && !hasCustomKey) {
      return await createAiQuotaExceededResponse(quotaStatus);
    }

    // Variable restored for context mapping and language detection
    const scopeResult = classifySubjectScope(trimmedPrompt);
    const isBengali = language === 'bn' || /[ঀ-৿]/.test(trimmedPrompt);

    // 6. Consume 1 AI query from student quota for valid requests
    const quota = await consumeAiQuota(student?.id, userApiKey);
    if (!quota.allowed) {
      return await createAiQuotaExceededResponse(quota);
    }

    const mergedContext = {
      ...context,
      studentId: student?.id,
      name: student?.name,
      isExamActive: false,
      subjectScope: scopeResult.subject
    };

    // 7. Call Gemini Master Educational Tutor
    const result = await askEducationalTutor({
      prompt: trimmedPrompt,
      history,
      context: mergedContext,
      mode,
      level,
      language: isBengali ? 'bn' : 'en',
      userApiKey
    });

    // 8. Response Validation: Ensure response exists and contains valid educational content
    const finalAnswer = result.answer && result.answer.trim().length > 0
      ? result.answer
      : (isBengali ? scopeResult.scopeMessageBn : scopeResult.scopeMessageEn);

    return NextResponse.json({
      ...result,
      answer: finalAnswer,
      reply: finalAnswer,
      content: finalAnswer,
      isOutOfScope: Boolean(result.isOutOfScope),
      detectedSubject: scopeResult.subject,
      goldPrice: await getDynamicGoldPrice(),
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
