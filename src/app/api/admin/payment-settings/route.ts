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

    const { upiId, payeeName, monthlyFee, qrImageUrl, paytmMid, paytmMerchantKey, paytmWebsite, paytmMode } = await req.json();

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "PaymentSetting" ADD COLUMN IF NOT EXISTS "paytmMid" TEXT DEFAULT '';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "PaymentSetting" ADD COLUMN IF NOT EXISTS "paytmMerchantKey" TEXT DEFAULT '';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "PaymentSetting" ADD COLUMN IF NOT EXISTS "paytmWebsite" TEXT DEFAULT 'DEFAULT';`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "PaymentSetting" ADD COLUMN IF NOT EXISTS "paytmMode" TEXT DEFAULT 'TEST';`);
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PaytmTransaction" (
          "id" TEXT PRIMARY KEY,
          "orderId" TEXT UNIQUE NOT NULL,
          "studentId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "txnId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "gatewayResponse" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        );
      `);
    } catch (migErr) {
      console.log("Paytm auto migration status:", migErr);
    }

    const settings = await prisma.paymentSetting.upsert({
      where: { id: "default" },
      update: {
        upiId: upiId || "9830507435@upi",
        payeeName: payeeName || "Arghyadeep Roy",
        monthlyFee: parseFloat(monthlyFee) || 99.0,
        qrImageUrl: qrImageUrl || "", paytmMid: paytmMid || "", paytmMerchantKey: paytmMerchantKey || "", paytmWebsite: paytmWebsite || "DEFAULT", paytmMode: paytmMode || "TEST"
      },
      create: {
        id: "default",
        upiId: upiId || "9830507435@upi",
        payeeName: payeeName || "Arghyadeep Roy",
        monthlyFee: parseFloat(monthlyFee) || 99.0,
        qrImageUrl: qrImageUrl || "", paytmMid: paytmMid || "", paytmMerchantKey: paytmMerchantKey || "", paytmWebsite: paytmWebsite || "DEFAULT", paytmMode: paytmMode || "TEST"
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save payment settings" }, { status: 500 });
  }
}