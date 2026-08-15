import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { requestId, action } = await req.json(); // action = "APPROVE" | "REJECT"

    if (!requestId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const accessReq = await prisma.testAccessRequest.findUnique({
      where: { id: requestId },
      include: { test: true }
    });

    if (!accessReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // 1. Create or update StudentTestOverride granting access for this student and test
      await prisma.studentTestOverride.upsert({
        where: {
          studentId_testId: {
            studentId: accessReq.studentId,
            testId: accessReq.testId
          }
        },
        create: {
          studentId: accessReq.studentId,
          testId: accessReq.testId,
          overrideUnlockAt: new Date(Date.now() - 3600000), // unlocked 1hr ago
          overrideLockAt: new Date(Date.now() + 86400000 * 7) // locked 7 days in future
        },
        update: {
          overrideUnlockAt: new Date(Date.now() - 3600000),
          overrideLockAt: new Date(Date.now() + 86400000 * 7)
        }
      });

      // 2. Update request status to APPROVED
      const updatedReq = await prisma.testAccessRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });

      return NextResponse.json({ success: true, message: "Request approved and live test access granted to student!", request: updatedReq });
    } else if (action === "REJECT") {
      const updatedReq = await prisma.testAccessRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });

      return NextResponse.json({ success: true, message: "Request rejected.", request: updatedReq });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Action notification error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
