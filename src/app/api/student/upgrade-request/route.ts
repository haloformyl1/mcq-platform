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
    const body = await req.json().catch(() => ({}));
    const { utrNumber, studentUpiId, amount } = body;
    const cleanUpi = studentUpiId ? String(studentUpiId).trim() : null;
    const cleanUtr = utrNumber ? String(utrNumber).trim() : null;
    const identifier = cleanUpi || cleanUtr;

    if (!identifier) {
      return NextResponse.json({ error: "Please enter a valid UPI ID." }, { status: 400 });
    }

    // Anti-Fraud check: Prevent re-using already approved UTR (only for 12-digit numeric bank UTR)
    if (cleanUtr && /^\d{12}$/.test(cleanUtr)) {
      const existingApproved = await prisma.subscriptionUpgradeRequest.findFirst({
        where: {
          utrNumber: { equals: cleanUtr, mode: "insensitive" },
          status: "APPROVED"
        }
      });

      if (existingApproved) {
        return NextResponse.json({
          error: "This UTR Ref Number (" + cleanUtr + ") has already been used and approved for another subscription. Fraudulent re-use is blocked."
        }, { status: 400 });
      }
    }

    const finalAmount = parseFloat(amount) || 199.0;

    // Check if there is already a PENDING request - update it if so, to allow student to adjust/retry
    const existingPending = await prisma.subscriptionUpgradeRequest.findFirst({
      where: { studentId, status: "PENDING" }
    });

    if (existingPending) {
      const updated = await prisma.subscriptionUpgradeRequest.update({
        where: { id: existingPending.id },
        data: {
          utrNumber: identifier,
          note: cleanUpi ? "Payer UPI ID: " + cleanUpi : existingPending.note,
          amount: finalAmount
        }
      });
      return NextResponse.json({
        message: "Payment request updated successfully!",
        request: updated
      });
    }

    const newRequest = await prisma.subscriptionUpgradeRequest.create({
      data: {
        studentId,
        utrNumber: identifier,
        note: cleanUpi ? "Payer UPI ID: " + cleanUpi : null,
        amount: finalAmount,
        status: "PENDING"
      }
    });

    return NextResponse.json({
      message: "Payment request initiated successfully!",
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

    let paymentSettings = await prisma.paymentSetting.findUnique({ where: { id: "default" } });
    if (!paymentSettings) {
      paymentSettings = await prisma.paymentSetting.create({
        data: { id: "default", upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 199.0 }
      });
    }

    return NextResponse.json({ request: latestRequest, paymentSettings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch upgrade request" }, { status: 500 });
  }
}
