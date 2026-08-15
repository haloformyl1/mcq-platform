import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await decrypt(session);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testId, message } = await req.json();
    if (!testId) {
      return NextResponse.json({ error: "Missing test ID" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const existingRequest = await prisma.testAccessRequest.findUnique({
      where: {
        studentId_testId: {
          studentId: payload.id,
          testId
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json({ success: true, message: "Request already submitted.", request: existingRequest });
    }

    const requestRecord = await prisma.testAccessRequest.create({
      data: {
        studentId: payload.id,
        testId,
        message: message || "Student requested live access for this expired test.",
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, request: requestRecord });
  } catch (error) {
    console.error("Access request error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
