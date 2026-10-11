import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" }
    });

    // If no plans found, fall back to all plans or seed
    if (plans.length === 0) {
      plans = await prisma.subscriptionPlan.findMany({
        orderBy: { price: "asc" }
      });
    }

    const response = NextResponse.json(plans);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  } catch (error) {
    console.error("GET /api/subscription-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch active plans" }, { status: 500 });
  }
}
