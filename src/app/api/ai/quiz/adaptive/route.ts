import { NextRequest, NextResponse } from "next/server";
import { generateAdaptiveQuiz } from "@/lib/ai/adaptiveQuizService";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ error: "Unauthorized. Student session required." }, { status: 401 });
    }

    const body = await req.json();
    const { count, language, apiKey } = body;

    const result = await generateAdaptiveQuiz({
      studentId: student.id,
      count: parseInt(count, 10) || 5,
      language,
      userApiKey: apiKey || req.headers.get("x-gemini-api-key") || undefined
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Adaptive Quiz Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate adaptive quiz." },
      { status: 500 }
    );
  }
}
