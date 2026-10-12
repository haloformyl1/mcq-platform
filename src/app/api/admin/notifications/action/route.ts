import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) return null;
  const payload = await decrypt(session);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { requestId, action } = body;

    if (!requestId || typeof requestId !== "string" || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Valid requestId and action ('APPROVE' or 'REJECT') are required" }, { status: 400 });
    }

    const cleanRequestId = requestId.trim();
    const accessReq = await prisma.testAccessRequest.findUnique({
      where: { id: cleanRequestId },
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
