import { NextRequest, NextResponse } from "next/server";
import { explainQuestionError } from "@/lib/aiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionText, options, selectedAnswer, correctAnswer, originalExplanation, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    if (!questionText || !options || !selectedAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: "Incomplete question details provided for AI diagnosis." },
        { status: 400 }
      );
    }

    const result = await explainQuestionError({
      questionText,
      options,
      selectedAnswer,
      correctAnswer,
      originalExplanation,
      userApiKey
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Explain Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI explanation." },
      { status: 500 }
    );
  }
}
