import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

async function ensureMigration() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SubscriptionUpgradeRequest" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SubscriptionUpgradeRequest" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);`);
  } catch (e) {
    // Migration already passed or raw query not needed
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureMigration();

    const requests = await prisma.subscriptionUpgradeRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            subscriptionStatus: true,
            subscriptionStartedAt: true,
            subscriptionExpiresAt: true
          }
        }
      }
    });

    const activeStudents = await prisma.student.findMany({
      where: { subscriptionStatus: "PAID" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        upgradeRequests: {
          where: { status: "APPROVED" },
          orderBy: { approvedAt: "desc" },
          take: 1
        }
      }
    });

    let paymentSettings = await prisma.paymentSetting.findUnique({ where: { id: "default" } });
    if (!paymentSettings) {
      paymentSettings = await prisma.paymentSetting.create({
        data: { id: "default", upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 99.0 }
      });
    }

    return NextResponse.json({ requests, activeStudents, paymentSettings });
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
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

    await ensureMigration();

    const body = await req.json();
    const { requestId, studentId: targetStudentId, action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Direct Student Actions (REVOKE or EXTEND)
    if (action === "REVOKE") {
      const sId = targetStudentId || (requestId ? (await prisma.subscriptionUpgradeRequest.findUnique({ where: { id: requestId } }))?.studentId : null);
      if (!sId) return NextResponse.json({ error: "Student ID required" }, { status: 400 });

      await prisma.student.update({
        where: { id: sId },
        data: {
          subscriptionStatus: "FREE",
          subscriptionStartedAt: null,
          subscriptionExpiresAt: null
        }
      });
      return NextResponse.json({ message: "Subscription revoked. Student reset to FREE plan." });
    }

    if (action === "EXTEND") {
      const sId = targetStudentId || (requestId ? (await prisma.subscriptionUpgradeRequest.findUnique({ where: { id: requestId } }))?.studentId : null);
      if (!sId) return NextResponse.json({ error: "Student ID required" }, { status: 400 });

      const student = await prisma.student.findUnique({ where: { id: sId } });
      const baseDate = student?.subscriptionExpiresAt && new Date(student.subscriptionExpiresAt) > new Date()
        ? new Date(student.subscriptionExpiresAt)
        : new Date();
      const newExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.student.update({
        where: { id: sId },
        data: {
          subscriptionStatus: "PAID",
          subscriptionExpiresAt: newExpiresAt
        }
      });
      return NextResponse.json({ message: "Subscription extended by 30 days!" });
    }

    // Request Actions (APPROVE or REJECT)
    if (!requestId) {
      return NextResponse.json({ error: "Request ID required" }, { status: 400 });
    }

    const upgradeReq = await prisma.subscriptionUpgradeRequest.findUnique({
      where: { id: requestId }
    });

    if (!upgradeReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      const activeSince = new Date();
      // Exact 30 days from approval
      const expiresAt = new Date(activeSince.getTime() + 30 * 24 * 60 * 60 * 1000);

      // 1. Upgrade student subscription to PAID with exact Active Since and Expiry
      await prisma.student.update({
        where: { id: upgradeReq.studentId },
        data: {
          subscriptionStatus: "PAID",
          subscriptionStartedAt: activeSince,
          subscriptionExpiresAt: expiresAt
        }
      });

      // 2. Mark request APPROVED with exact timestamps
      const updatedReq = await prisma.subscriptionUpgradeRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedAt: activeSince,
          expiresAt: expiresAt
        }
      });

      return NextResponse.json({ 
        message: "Subscription upgraded to PAID successfully for 30 days!", 
        request: updatedReq,
        activeSince: activeSince.toISOString(),
        expiresAt: expiresAt.toISOString()
      });
    } else if (action === "REJECT") {
      const updatedReq = await prisma.subscriptionUpgradeRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });

      return NextResponse.json({ message: "Subscription request rejected.", request: updatedReq });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

    await ensureMigration();

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

      const activeSince = new Date();
      const expiresAt = new Date(activeSince.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.student.update({
        where: { id: matchingReq.studentId },
        data: {
          subscriptionStatus: "PAID",
          subscriptionStartedAt: activeSince,
          subscriptionExpiresAt: expiresAt
        }
      });

      await prisma.subscriptionUpgradeRequest.update({
        where: { id: matchingReq.id },
        data: {
          status: "APPROVED",
          approvedAt: activeSince,
          expiresAt: expiresAt
        }
      });

      return NextResponse.json({
        success: true,
        message: `Verified! Student ${matchingReq.student.name || matchingReq.student.email} granted 30-Day Premium Pass.`
      });
    }

    // 2. Bulk Batch UTR Verification
    if (batchUtrList && Array.isArray(batchUtrList)) {
      const cleanList = batchUtrList.map(u => String(u).trim()).filter(Boolean);

      const pendingReqs = await prisma.subscriptionUpgradeRequest.findMany({
        where: { status: "PENDING" }
      });

      let approvedCount = 0;

      for (const req of pendingReqs) {
        if (req.utrNumber && cleanList.some(u => u.toLowerCase() === req.utrNumber?.toLowerCase())) {
          const activeSince = new Date();
          const expiresAt = new Date(activeSince.getTime() + 30 * 24 * 60 * 60 * 1000);

          await prisma.student.update({
            where: { id: req.studentId },
            data: {
              subscriptionStatus: "PAID",
              subscriptionStartedAt: activeSince,
              subscriptionExpiresAt: expiresAt
            }
          });

          await prisma.subscriptionUpgradeRequest.update({
            where: { id: req.id },
            data: {
              status: "APPROVED",
              approvedAt: activeSince,
              expiresAt: expiresAt
            }
          });

          approvedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        approvedCount,
        message: `Batch Verified! Approved ${approvedCount} student payments instantly with 30-Day Pass.`
      });
    }

    return NextResponse.json({ error: "Provide utrQuery or batchUtrList" }, { status: 400 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Failed to verify payments" }, { status: 500 });
  }
}