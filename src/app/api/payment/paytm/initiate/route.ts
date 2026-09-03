import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import PaytmChecksum from "paytmchecksum";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await decrypt(session);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const studentId = payload.id;
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const settings = await prisma.paymentSetting.findUnique({ where: { id: "default" } });
    const mid = settings?.paytmMid || process.env.PAYTM_MID;
    const mkey = settings?.paytmMerchantKey || process.env.PAYTM_MERCHANT_KEY;
    const website = settings?.paytmWebsite || process.env.PAYTM_WEBSITE || "DEFAULT";
    const amount = (settings?.monthlyFee || 99.0).toFixed(2);

    if (!mid || !mkey) {
      return NextResponse.json({ 
        error: "Paytm Gateway is currently in offline mode. Please use manual UPI payment or contact Admin." 
      }, { status: 400 });
    }

    const orderId = `PIE_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const paytmParams: Record<string, any> = {
      body: {
        requestType: "Payment",
        mid: mid,
        websiteName: website,
        orderId: orderId,
        callbackUrl: `https://${req.headers.get("host")}/api/payment/paytm/callback`,
        txnAmount: {
          value: amount,
          currency: "INR",
        },
        userInfo: {
          custId: student.id,
          email: student.email,
        },
      },
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      mkey
    );

    paytmParams.head = {
      signature: checksum,
    };

    // Save pending transaction record
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PaytmTransaction" ("id", "orderId", "studentId", "amount", "status", "updatedAt")
      VALUES ('${orderId}', '${orderId}', '${student.id}', ${parseFloat(amount)}, 'PENDING', CURRENT_TIMESTAMP)
      ON CONFLICT ("orderId") DO NOTHING;
    `);

    const isLive = settings?.paytmMode === "LIVE";
    const paytmHost = isLive ? "securegw.paytm.in" : "securegw-stage.paytm.in";
    const txnTokenUrl = `https://${paytmHost}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      mid,
      txnTokenUrl,
      paytmParams
    });
  } catch (error: any) {
    console.error("Paytm initiate error:", error);
    return NextResponse.json({ error: error?.message || "Failed to initiate Paytm transaction" }, { status: 500 });
  }
}