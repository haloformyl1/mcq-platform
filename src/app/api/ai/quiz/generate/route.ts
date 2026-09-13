import { NextRequest, NextResponse } from "next/server";
import { generateEducationalQuiz } from "@/lib/ai/quizGenerator";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/ai/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    // Rate Limiting (15 requests / minute)
    const clientId = getClientIdentifier(req, student?.id);
    const rateLimit = checkRateLimit(clientId, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await req.json();
    const { subject, chapter, topic, count, difficulty, questionType, language, apiKey } = body;

    if (!chapter || typeof chapter !== 'string') {
      return NextResponse.json({ error: "Chapter or topic is required to generate a quiz." }, { status: 400 });
    }

    const requestedCount = Math.min(Math.max(parseInt(count, 10) || 3, 1), 10);

    const questions = await generateEducationalQuiz({
      subject,
      chapter: chapter.trim(),
      topic,
      count: requestedCount,
      difficulty,
      questionType,
      language,
      userApiKey: apiKey || req.headers.get("x-gemini-api-key") || undefined
    });

    const enrichedQuestions = questions.map(q => ({
      ...q,
      options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)
    }));
    return NextResponse.json({ success: true, questions: enrichedQuestions });
  } catch (err: any) {
    console.error("Quiz Generation Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate educational quiz." },
      { status: 500 }
    );
  }
}
