import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = session ? await decrypt(session) : null;

    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.id as string;

    // Check if there is already a PENDING request
    const existingPending = await prisma.subscriptionUpgradeRequest.findFirst({
      where: { studentId, status: "PENDING" }
    });

    if (existingPending) {
      return NextResponse.json({ 
        message: "Your subscription upgrade request is already pending admin review.",
        request: existingPending 
      });
    }

    const { utrNumber, amount } = await req.json().catch(() => ({}));
    const cleanUtr = utrNumber ? String(utrNumber).trim() : null;

    if (cleanUtr) {
      // Anti-Fraud check: Prevent re-using already approved UTR
      const existingApproved = await prisma.subscriptionUpgradeRequest.findFirst({
        where: {
          utrNumber: { equals: cleanUtr, mode: "insensitive" },
          status: "APPROVED"
        }
      });

      if (existingApproved) {
        return NextResponse.json({
          error: `This UTR Ref Number (${cleanUtr}) has already been used and approved for another subscription. Fraudulent re-use is blocked.`
        }, { status: 400 });
      }
    }

    const newRequest = await prisma.subscriptionUpgradeRequest.create({
      data: {
        studentId,
        utrNumber: cleanUtr,
        amount: parseFloat(amount) || 99.0,
        status: "PENDING"
      }
    });

    return NextResponse.json({
      message: "Upgrade request sent to admin successfully!",
      request: newRequest
    });
  } catch (error) {
    console.error("Error creating subscription upgrade request:", error);
    return NextResponse.json({ error: "Failed to send upgrade request" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = session ? await decrypt(session) : null;

    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.id as string;

    const latestRequest = await prisma.subscriptionUpgradeRequest.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ request: latestRequest });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch upgrade request" }, { status: 500 });
  }
}
