import { NextRequest, NextResponse } from "next/server";
import { generateAiMcqs } from "@/lib/aiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, count, difficulty, targetExam } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: "Please enter a valid chemistry topic or chapter name." },
        { status: 400 }
      );
    }

    const questions = await generateAiMcqs({
      topic: topic.trim(),
      count: parseInt(count, 10) || 3,
      difficulty: difficulty || "Medium",
      targetExam: targetExam || "NEET / JEE Mains"
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    console.error("Admin AI Generate Questions Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate questions with AI." },
      { status: 500 }
    );
  }
}
