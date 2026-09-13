import { NextRequest, NextResponse } from "next/server";
import { getProgressiveHint } from "@/lib/ai/doubtSolver";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionText, options, correctAnswer, hintLevel, revealFullSolution, language, apiKey } = body;

    if (!questionText) {
      return NextResponse.json({ error: "Question text is required." }, { status: 400 });
    }

    const safeLevel = (hintLevel >= 1 && hintLevel <= 4) ? hintLevel : (revealFullSolution ? 4 : 1);

    const hint = await getProgressiveHint({
      questionText,
      options,
      correctAnswer,
      hintLevel: safeLevel as 1 | 2 | 3 | 4,
      language,
      userApiKey: apiKey || req.headers.get("x-gemini-api-key") || undefined
    });

    return NextResponse.json({ 
      success: true, 
      hint, 
      doubtSolution: hint 
    });
  } catch (err: any) {
    console.error("Doubt Solver Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate hint." },
      { status: 500 }
    );
  }
}
