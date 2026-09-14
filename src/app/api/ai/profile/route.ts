import { NextRequest, NextResponse } from "next/server";
import { computeStudentLearningProfile } from "@/lib/ai/weaknessDetector";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { getAiQuotaStatus } from "@/lib/ai/aiQuota";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ error: "Unauthorized. Student session required." }, { status: 401 });
    }

    const [profile, aiQuota] = await Promise.all([
      computeStudentLearningProfile(student.id),
      getAiQuotaStatus(student.id)
    ]);

    return NextResponse.json({ profile, aiQuota });
  } catch (err: any) {
    console.error("AI Profile Route Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to compute learning profile." },
      { status: 500 }
    );
  }
}
