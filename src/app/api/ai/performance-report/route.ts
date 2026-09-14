import { NextRequest, NextResponse } from "next/server";
import { generatePerformanceReport } from "@/lib/ai/performanceAnalyzer";
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

    if (!student || !student.id) {
      return NextResponse.json(
        { error: "Unauthorized. Student session required to view performance reports." },
        { status: 401 }
      );
    }

    // Rate Limiting (15 requests / minute)
    const clientId = getClientIdentifier(req, student.id);
    const rateLimit = checkRateLimit(clientId, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await req.json();
    const { attemptId, language, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    if (!attemptId || typeof attemptId !== 'string') {
      return NextResponse.json({ error: "Valid Attempt ID is required." }, { status: 400 });
    }

    // STRICT IDOR & AUTHORIZATION VERIFICATION:
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentId: true,
        status: true
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt record not found." }, { status: 404 });
    }

    // Verify ownership: Students can ONLY access their own test attempts
    if (attempt.studentId !== student.id) {
      return NextResponse.json(
        { error: "Access denied. You can only view performance reports for your own examinations." },
        { status: 403 }
      );
    }

    // Verify exam is submitted: Cannot analyze test while in progress
    if (attempt.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: "Performance analysis is only available after submitting the examination." },
        { status: 400 }
      );
    }

    // DAILY FREE TIER AI QUOTA CHECK
    const quota = await consumeAiQuota(student.id, userApiKey);
    if (!quota.allowed) {
      return createAiQuotaExceededResponse(quota);
    }

    const baseReport = await generatePerformanceReport({
      attemptId,
      language,
      userApiKey
    });

    if (!baseReport) {
      return NextResponse.json({ error: "Failed to generate report for this attempt." }, { status: 404 });
    }

    // Enrich with convenience aliases
    const enrichedReport = {
      ...baseReport,
      overallSummary: baseReport.overallEvaluation,
      overallScore: baseReport.score,
      accuracy: baseReport.percentage,
      totalQuestions: baseReport.totalQuestions,
      correctAnswers: baseReport.correctCount,
      incorrectAnswers: baseReport.incorrectCount,
      unattemptedQuestions: baseReport.unansweredCount,
      mistakePatterns: baseReport.conceptualTrapsIdentified?.map(t => t.trapReason) || [],
      personalizedStudyPlan: baseReport.recommendedRevision 
        ? `Focus intensive revision on ${baseReport.weakTopics?.join(', ') || 'weak areas'} with ${baseReport.recommendedRevision.suggestedRecoveryQuizQuestions || 5} adaptive practice questions.`
        : "Complete recommended recovery drills."
    };

    return NextResponse.json({
      success: true,
      report: enrichedReport,
      quota: {
        queriesUsed: quota.queriesUsed,
        dailyLimit: quota.totalLimit,
        remaining: quota.remaining,
        isUnlimited: quota.isUnlimited
      }
    });
  } catch (err: any) {
    console.error("Performance Report Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to analyze performance." },
      { status: 500 }
    );
  }
}
