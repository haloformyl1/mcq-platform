import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const [requests, violations] = await Promise.all([
      prisma.testAccessRequest.findMany({
        include: {
          student: { select: { id: true, name: true, email: true } },
          test: { select: { id: true, title: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.proctoringViolation.findMany({
        include: {
          student: { select: { id: true, name: true, email: true } },
          test: { select: { id: true, title: true } },
          attempt: { select: { id: true, startedAt: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ]);

    return NextResponse.json({ requests, violations });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
