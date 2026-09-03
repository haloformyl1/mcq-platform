import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.subscriptionUpgradeRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            subscriptionStatus: true
          }
        }
      }
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch upgrade requests" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await req.json(); // action: "APPROVE" or "REJECT"

    if (!requestId || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const upgradeReq = await prisma.subscriptionUpgradeRequest.findUnique({
      where: { id: requestId }
    });

    if (!upgradeReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // 1. Upgrade student subscription to PAID
      await prisma.student.update({
        where: { id: upgradeReq.studentId },
        data: { subscriptionStatus: "PAID" }
      });

      // 2. Mark request APPROVED
      const updatedReq = await prisma.subscriptionUpgradeRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });

      return NextResponse.json({ message: "Subscription upgraded to PAID successfully!", request: updatedReq });
    } else {
      // Mark request REJECTED (Student stays FREE and can request again)
      const updatedReq = await prisma.subscriptionUpgradeRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });

      return NextResponse.json({ message: "Subscription request rejected.", request: updatedReq });
    }
  } catch (error) {
    console.error("Error processing upgrade request:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { utrQuery, batchUtrList } = await req.json();

    // 1. Single Instant UTR Verification
    if (utrQuery) {
      const cleanUtr = String(utrQuery).trim();

      const matchingReq = await prisma.subscriptionUpgradeRequest.findFirst({
        where: {
          utrNumber: { equals: cleanUtr, mode: "insensitive" },
          status: "PENDING"
        },
        include: { student: true }
      });

      if (!matchingReq) {
        return NextResponse.json({ error: `No pending upgrade request found with UTR Ref "${cleanUtr}".` }, { status: 404 });
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await prisma.student.update({
        where: { id: matchingReq.studentId },
        data: { subscriptionStatus: "PAID", subscriptionExpiresAt: expiresAt }
      });

      await prisma.subscriptionUpgradeRequest.update({
        where: { id: matchingReq.id },
        data: { status: "APPROVED" }
      });

      return NextResponse.json({
        success: true,
        message: `Verified! Student ${matchingReq.student.name || matchingReq.student.email} granted 30-Day Netflix Pass.`
      });
    }

    // 2. Bulk Batch UTR Verification
    if (batchUtrList && Array.isArray(batchUtrList)) {
      const cleanList = batchUtrList.map(u => String(u).trim()).filter(Boolean);

      const pendingReqs = await prisma.subscriptionUpgradeRequest.findMany({
        where: { status: "PENDING" }
      });

      let approvedCount = 0;
      const approvedStudents: string[] = [];

      for (const req of pendingReqs) {
        if (req.utrNumber && cleanList.some(u => u.toLowerCase() === req.utrNumber?.toLowerCase())) {
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await prisma.student.update({
            where: { id: req.studentId },
            data: { subscriptionStatus: "PAID", subscriptionExpiresAt: expiresAt }
          });

          await prisma.subscriptionUpgradeRequest.update({
            where: { id: req.id },
            data: { status: "APPROVED" }
          });

          approvedCount++;
          approvedStudents.push(req.studentId);
        }
      }

      return NextResponse.json({
        success: true,
        approvedCount,
        message: `Batch Verified! Approved ${approvedCount} student payments instantly.`
      });
    }

    return NextResponse.json({ error: "Provide utrQuery or batchUtrList" }, { status: 400 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Failed to verify payments" }, { status: 500 });
  }
}