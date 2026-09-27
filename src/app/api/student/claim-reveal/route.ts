import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const studentSession = cookieStore.get("student_session")?.value;
    const payload = studentSession ? await decrypt(studentSession) : null;

    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized", showReveal: false }, { status: 401 });
    }

    const studentId = payload.id;

    const result = await prisma.subscriptionUpgradeRequest.updateMany({
      where: {
        studentId: studentId,
        status: "APPROVED",
        approvalRevealClaimedAt: null,
      },
      data: {
        approvalRevealClaimedAt: new Date(),
      }
    });

    if (result.count > 0) {
      return NextResponse.json({ showReveal: true });
    }

    return NextResponse.json({ showReveal: false });
  } catch (error) {
    console.error("Reveal claim error:", error);
    return NextResponse.json({ error: "Internal server error", showReveal: false }, { status: 500 });
  }
}
