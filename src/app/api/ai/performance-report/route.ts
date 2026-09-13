import { NextRequest, NextResponse } from "next/server";
import { generatePerformanceReport } from "@/lib/ai/performanceAnalyzer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId, language, apiKey } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required." }, { status: 400 });
    }

    const baseReport = await generatePerformanceReport({
      attemptId,
      language,
      userApiKey: apiKey || req.headers.get("x-gemini-api-key") || undefined
    });

    if (!baseReport) {
      return NextResponse.json({ error: "Attempt record not found." }, { status: 404 });
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

    return NextResponse.json({ success: true, report: enrichedReport });
  } catch (err: any) {
    console.error("Performance Report Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to analyze performance." },
      { status: 500 }
    );
  }
}
