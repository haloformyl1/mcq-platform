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
    const userPrompt = body.prompt || body.message;
    const { history, context, mode, level, language, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    // 2. Validate Request
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return NextResponse.json({ error: "Please enter a valid study question." }, { status: 400 });
    }

    const trimmedPrompt = userPrompt.trim();

    // 3. Server-Side Anti-Cheating Verification during active exams
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
      const isBengali = language === 'bn' || /[ঀ-৿]/.test(trimmedPrompt);
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
        language: isBengali ? 'bn' : 'en'
      });
    }

    // 4. Pre-check Daily AI Quota (Check without consuming yet)
    const quotaStatus = await getAiQuotaStatus(student?.id);
    const hasCustomKey = Boolean(userApiKey && typeof userApiKey === 'string' && userApiKey.trim().length > 10);
    
    if (!quotaStatus.allowed && !hasCustomKey) {
      return await createAiQuotaExceededResponse(quotaStatus);
    }

    // 5. SERVER-SIDE SUBJECT GATE & SCOPE CHECK
    // Restricts queries strictly to Physics, Chemistry, Mathematics, and Biology
    const scopeResult = classifySubjectScope(trimmedPrompt);
    const isBengali = language === 'bn' || /[ঀ-৿]/.test(trimmedPrompt);

    if (!scopeResult.allowed) {
      // OUT OF SCOPE: Return polite scope message immediately WITHOUT consuming quota or calling Gemini
      const refusalMessage = isBengali ? scopeResult.scopeMessageBn : scopeResult.scopeMessageEn;
      const goldPrice = await getDynamicGoldPrice();

      return NextResponse.json({
        answer: refusalMessage,
        reply: refusalMessage,
        content: refusalMessage,
        isOutOfScope: true,
        model: "PIECHEM Subject Scope Guard",
        sources: [],
        sourceCategory: 'GENERAL_ACADEMIC',
        groundedInPiechem: false,
        suggestedFollowUps: isBengali ? [
          "নিউটনের গতিসূত্র ব্যাখ্যা কর",
          "SN2 বিক্রিয়ার কৌশল দেখাও",
          "অন্তরকলন সূত্র সমাধান কর",
          "ডিএনএ অনুলিপন প্রক্রিয়া ব্যাখ্যা কর"
        ] : [
          "Explain Newton's second law",
          "Explain SN2 reaction mechanism",
          "Solve ∫x² dx",
          "Explain DNA replication"
        ],
        language: isBengali ? 'bn' : 'en',
        goldPrice,
        quota: {
          queriesUsed: quotaStatus.queriesUsed,
          totalLimit: quotaStatus.totalLimit,
          dailyLimit: quotaStatus.totalLimit,
          remaining: quotaStatus.remaining,
          isUnlimited: quotaStatus.isUnlimited
        }
      });
    }

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
