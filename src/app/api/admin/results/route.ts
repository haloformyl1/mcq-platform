import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const attempts = await prisma.testAttempt.findMany({
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { email: true } },
        test: { select: { title: true } },
      }
    });
    return NextResponse.json(attempts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
