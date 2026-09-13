import { NextRequest, NextResponse } from "next/server";
import { askEducationalTutor } from "@/lib/ai/tutorService";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    const body = await req.json();
    const userPrompt = body.prompt || body.message;
    const { history, context, mode, level, language, apiKey } = body;

    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return NextResponse.json({ error: "Please enter a valid study question." }, { status: 400 });
    }

    const mergedContext = {
      ...context,
      studentId: student?.id,
      name: student?.name,
    };

    const result = await askEducationalTutor({
      prompt: userPrompt.trim(),
      history,
      context: mergedContext,
      mode,
      level,
      language,
      userApiKey: apiKey || req.headers.get("x-gemini-api-key") || undefined
    });

    return NextResponse.json({ ...result, reply: result.answer, content: result.answer });
  } catch (err: any) {
    console.error("AI Tutor Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate educational response." },
      { status: 500 }
    );
  }
}
