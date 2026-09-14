import { NextRequest, NextResponse } from "next/server";
import { getProgressiveHint } from "@/lib/ai/doubtSolver";
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

    // Server-Side Rate Limiting (20 requests / minute)
    const clientId = getClientIdentifier(req, student?.id);
    const rateLimit = checkRateLimit(clientId, 20, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    // SERVER-SIDE ANTI-CHEATING VERIFICATION:
    if (student?.id) {
      const activeAttempt = await prisma.testAttempt.findFirst({
        where: {
          studentId: student.id,
          status: 'IN_PROGRESS'
        }
      });
      if (activeAttempt) {
        return NextResponse.json(
          {
            error: "AI assistance is disabled during active examinations. Complete your test before seeking AI explanations.",
            activeExamBlocked: true
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { questionText, options, correctAnswer, hintLevel, revealFullSolution, language, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    if (!questionText) {
      return NextResponse.json({ error: "Question text is required." }, { status: 400 });
    }

    // DAILY FREE TIER AI QUOTA CHECK
    const quota = await consumeAiQuota(student?.id, userApiKey);
    if (!quota.allowed) {
      return await createAiQuotaExceededResponse(quota);
    }

    const safeLevel = (hintLevel >= 1 && hintLevel <= 4) ? hintLevel : (revealFullSolution ? 4 : 1);

    const hint = await getProgressiveHint({
      questionText,
      options,
      correctAnswer,
      hintLevel: safeLevel as 1 | 2 | 3 | 4,
      language,
      userApiKey
    });

    return NextResponse.json({ 
      success: true, 
      hint, 
      doubtSolution: hint,
      quota: {
        queriesUsed: quota.queriesUsed,
        totalLimit: quota.totalLimit,
        dailyLimit: quota.totalLimit,
        remaining: quota.remaining,
        isUnlimited: quota.isUnlimited
      }
    });
  } catch (err: any) {
    console.error("Doubt Solver Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate hint." },
      { status: 500 }
    );
  }
}
