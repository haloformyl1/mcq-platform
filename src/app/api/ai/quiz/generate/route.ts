import { NextRequest, NextResponse } from "next/server";
import { generateEducationalQuiz } from "@/lib/ai/quizGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, chapter, topic, count, difficulty, questionType, language, apiKey } = body;

    if (!chapter || typeof chapter !== 'string') {
      return NextResponse.json({ error: "Chapter or topic is required to generate a quiz." }, { status: 400 });
    }

    const questions = await generateEducationalQuiz({
      subject,
      chapter: chapter.trim(),
      topic,
      count: parseInt(count, 10) || 3,
      difficulty,
      questionType,
      language,
      userApiKey: apiKey || req.headers.get("x-gemini-api-key") || undefined
    });

    return NextResponse.json({ success: true, questions });
  } catch (err: any) {
    console.error("Quiz Generation Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate educational quiz." },
      { status: 500 }
    );
  }
}
