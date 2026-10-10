import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/admin/subscription-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, durationDays, benefits, isActive } = body;

    // Check active plans limit
    if (isActive) {
      const activeCount = await prisma.subscriptionPlan.count({
        where: { isActive: true }
      });
      if (activeCount >= 5) {
        return NextResponse.json({ error: "Maximum of 5 active plans allowed." }, { status: 400 });
      }
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price: parseFloat(price.toString()),
        durationDays: parseInt(durationDays.toString(), 10),
        benefits: benefits || [],
        isActive: isActive ?? true
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("POST /api/admin/subscription-plans error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
