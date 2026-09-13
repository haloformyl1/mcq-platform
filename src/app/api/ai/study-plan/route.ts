import { NextRequest, NextResponse } from "next/server";
import { generatePersonalizedStudyPlan } from "@/lib/ai/studyPlanner";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/ai/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ error: "Unauthorized. Student session required." }, { status: 401 });
    }

    // Rate Limiting (10 requests / minute)
    const clientId = getClientIdentifier(req, student.id);
    const rateLimit = checkRateLimit(clientId, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfterSeconds);
    }

    const body = await req.json();
    const durationDays = Math.min(Math.max(parseInt(body.durationDays || body.days, 10) || 7, 1), 30);
    const targetGoal = body.targetGoal || body.targetExam || "NEET / Board Examination";
    const { language, level, apiKey } = body;

    const plan = await generatePersonalizedStudyPlan({
      studentId: student.id,
      durationDays,
      targetGoal,
      language,
      level,
      userApiKey: apiKey || req.headers.get("x-gemini-api-key") || undefined
    });

    return NextResponse.json({ 
      success: true, 
      plan, 
      studyPlan: plan 
    });
  } catch (err: any) {
    console.error("Study Plan Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate study plan." },
      { status: 500 }
    );
  }
}
