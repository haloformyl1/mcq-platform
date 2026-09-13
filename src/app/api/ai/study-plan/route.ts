import { NextRequest, NextResponse } from "next/server";
import { generatePersonalizedStudyPlan } from "@/lib/ai/studyPlanner";
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
    const durationDays = body.durationDays || body.days || 7;
    const targetGoal = body.targetGoal || body.targetExam || "NEET / Board Examination";
    const { language, level, apiKey } = body;

    const plan = await generatePersonalizedStudyPlan({
      studentId: student.id,
      durationDays: parseInt(durationDays, 10) || 7,
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
