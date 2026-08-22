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
