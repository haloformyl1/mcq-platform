import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { recalculateAllSubmittedAttempts } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await recalculateAllSubmittedAttempts();

    const attempts = await prisma.testAttempt.findMany({
      orderBy: { startedAt: "desc" },
      include: {
        student: { select: { id: true, name: true, email: true } },
        test: { select: { id: true, title: true, totalQuestions: true, durationMinutes: true } },
        answers: { select: { isChangedInResume: true, isFreshInResume: true, previousAnswer: true, selectedAnswer: true, answeredAt: true } },
      }
    });
    return NextResponse.json(attempts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
