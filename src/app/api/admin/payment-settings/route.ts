import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET() {
  try {
    let settings = await prisma.paymentSetting.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.paymentSetting.create({
        data: { id: "default", upiId: "9830507435@upi", payeeName: "Arghyadeep Roy", monthlyFee: 99.0 }
      });
    }
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payment settings" }, { status: 500 });
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

    const { upiId, payeeName, monthlyFee, qrImageUrl } = await req.json();

    const settings = await prisma.paymentSetting.upsert({
      where: { id: "default" },
      update: {
        upiId: upiId || "9830507435@upi",
        payeeName: payeeName || "Arghyadeep Roy",
        monthlyFee: parseFloat(monthlyFee) || 99.0,
        qrImageUrl: qrImageUrl || ""
      },
      create: {
        id: "default",
        upiId: upiId || "9830507435@upi",
        payeeName: payeeName || "Arghyadeep Roy",
        monthlyFee: parseFloat(monthlyFee) || 99.0,
        qrImageUrl: qrImageUrl || ""
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save payment settings" }, { status: 500 });
  }
}