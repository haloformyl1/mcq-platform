import { NextRequest, NextResponse } from "next/server";
import { explainQuestionError } from "@/lib/aiClient";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/ai/rateLimiter";
import { consumeAiQuota, createAiQuotaExceededResponse } from "@/lib/ai/aiQuota";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    // Rate Limiting (20 requests / minute)
    const clientId = getClientIdentifier(req, student?.id);
    const rateLimit = checkRateLimit(clientId, 20, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await req.json();
    const { questionText, options, selectedAnswer, correctAnswer, originalExplanation, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    if (!questionText || !options || !selectedAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Incomplete question details provided for AI diagnosis." },
        { status: 400 }
      );
    }

    // DAILY FREE TIER AI QUOTA CHECK
    const quota = await consumeAiQuota(student?.id, userApiKey);
    if (!quota.allowed) {
      return await createAiQuotaExceededResponse(quota);
    }

    const result = await explainQuestionError({
      questionText,
      options,
      selectedAnswer,
      correctAnswer,
      originalExplanation,
      userApiKey
    });

    return NextResponse.json({
      ...result,
      quota: {
        queriesUsed: quota.queriesUsed,
        totalLimit: quota.totalLimit,
        dailyLimit: quota.totalLimit,
        remaining: quota.remaining,
        isUnlimited: quota.isUnlimited
      }
    });
  } catch (error: any) {
    console.error("AI Explain Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI explanation." },
      { status: 500 }
    );
  }
}
