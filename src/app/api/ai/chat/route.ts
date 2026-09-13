import { NextRequest, NextResponse } from "next/server";
import { askAiChemist } from "@/lib/aiClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, history, apiKey } = body;
    const userApiKey = apiKey || req.headers.get("x-gemini-api-key") || undefined;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: "Please provide a valid chemistry question." }, { status: 400 });
    }

    const result = await askAiChemist(prompt.trim(), history || [], userApiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Chat Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI response." },
      { status: 500 }
    );
  }
}
