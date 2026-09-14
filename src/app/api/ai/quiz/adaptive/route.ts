import { NextRequest, NextResponse } from "next/server";
import { generateAdaptiveQuiz } from "@/lib/ai/adaptiveQuizService";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/ai/rateLimiter";
import { consumeAiQuota, createAiQuotaExceededResponse } from "@/lib/ai/aiQuota";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ error: "Unauthorized. Student session required." }, { status: 401 });
    }

    // Rate Limiting (15 requests / minute)
    const clientId = getClientIdentifier(req, student.id);
    const rateLimit = checkRateLimit(clientId, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await req.json();
    const { count, language, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    // DAILY FREE TIER AI QUOTA CHECK
    const quota = await consumeAiQuota(student.id, userApiKey);
    if (!quota.allowed) {
      return createAiQuotaExceededResponse(quota);
    }

    const requestedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 10);

    const result = await generateAdaptiveQuiz({
      studentId: student.id,
      count: requestedCount,
      language,
      userApiKey
    });

    return NextResponse.json({
      success: true,
      ...result,
      quota: {
        queriesUsed: quota.queriesUsed,
        totalLimit: quota.totalLimit,
        dailyLimit: quota.totalLimit,
        remaining: quota.remaining,
        isUnlimited: quota.isUnlimited
      }
    });
  } catch (err: any) {
    console.error("Adaptive Quiz Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate adaptive quiz." },
      { status: 500 }
    );
  }
}
