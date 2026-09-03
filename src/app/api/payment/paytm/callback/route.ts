import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PaytmChecksum from "paytmchecksum";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const paytmResponse: Record<string, any> = {};
    formData.forEach((value, key) => {
      paytmResponse[key] = value;
    });

    const settings = await prisma.paymentSetting.findUnique({ where: { id: "default" } });
    const mkey = settings?.paytmMerchantKey || process.env.PAYTM_MERCHANT_KEY || "";

    const paytmChecksum = paytmResponse.CHECKSUMHASH;
    delete paytmResponse.CHECKSUMHASH;

    let isValidChecksum = false;
    if (mkey && paytmChecksum) {
      isValidChecksum = PaytmChecksum.verifySignature(paytmResponse, mkey, paytmChecksum);
    }

    const orderId = paytmResponse.ORDERID;
    const status = paytmResponse.STATUS;
    const txnId = paytmResponse.TXNID;

    if (status === "TXN_SUCCESS") {
      // Find order to identify student
      const txnRecord: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM "PaytmTransaction" WHERE "orderId" = '${orderId}' LIMIT 1;`
      );

      const studentId = txnRecord && txnRecord[0] ? txnRecord[0].studentId : null;

      if (studentId) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.student.update({
          where: { id: studentId },
          data: {
            subscriptionStatus: "PAID",
            subscriptionExpiresAt: expiresAt
          }
        });
      }

      await prisma.$executeRawUnsafe(
        `UPDATE "PaytmTransaction" SET "status" = 'SUCCESS', "txnId" = '${txnId}' WHERE "orderId" = '${orderId}';`
      );

      return NextResponse.redirect(new URL("/dashboard/account?payment=success", req.url));
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "PaytmTransaction" SET "status" = 'FAILED' WHERE "orderId" = '${orderId}';`
      );
      return NextResponse.redirect(new URL("/dashboard/account?payment=failed", req.url));
    }
  } catch (error) {
    console.error("Paytm Callback Error:", error);
    return NextResponse.redirect(new URL("/dashboard/account?payment=error", req.url));
  }
}