import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { eyeSlipDurationSeconds, maxPhoneWarnings, maxMultiPersonWarnings, maxEyeSlipWarnings, maxTotalWarnings } = await req.json();

    const result = await prisma.test.updateMany({
      data: {
        eyeSlipDurationSeconds: Number(eyeSlipDurationSeconds) || 10,
        maxPhoneWarnings: Number(maxPhoneWarnings) ?? 1,
        maxMultiPersonWarnings: Number(maxMultiPersonWarnings) ?? 1,
        maxEyeSlipWarnings: Number(maxEyeSlipWarnings) ?? 3,
        maxTotalWarnings: Number(maxTotalWarnings) ?? 3,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Global proctoring rules applied to ${result.count} test(s) successfully!`,
      count: result.count
    });
  } catch (error) {
    console.error("Failed to update global proctoring rules:", error);
    return NextResponse.json({ error: "Failed to update proctoring settings" }, { status: 500 });
  }
}
