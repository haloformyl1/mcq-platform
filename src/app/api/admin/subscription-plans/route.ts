import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    name: "PIE Basic",
    description: "Foundational practice tier for chemistry students",
    price: 0,
    durationDays: 30,
    isActive: true,
    benefits: [
      "Chemistry Exam Tests: Selected tests are free.",
      "AI Tutor & Doubt Solver: 5 queries / day",
      "Answer Explanations: Standard Answer Key",
      "Study Materials: Selected Free Chapters with limited downloading option",
      "Ranking & Analytics: Basic Score Summary",
      "Supported Devices: 1 Active Device",
      "PIE LAB: Not Included"
    ]
  },
  {
    name: "PIE Pro",
    description: "Full access to all exams, 3D models, Boards & NEET/JEE Contents.",
    price: 299,
    durationDays: 30,
    isActive: true,
    benefits: [
      "Chemistry Exam Tests: Unlimited",
      "AI Tutor & Doubt Solver: 20 queries / day",
      "Answer Explanations: Full Solutions with PIE AI",
      "Study Materials: Complete Digital Library with 5 downloads / day",
      "Ranking & Analytics: Proctored National Percentile",
      "Supported Devices: 1 active device",
      "PIE LAB: Included (Basic Access)"
    ]
  },
  {
    name: "PIE Ultra",
    description: "All benifits of PIE Pro along with unlimited access to PIE AI, PIE LAB",
    price: 499,
    durationDays: 30,
    isActive: true,
    benefits: [
      "Chemistry Exam Tests: Unlimited",
      "AI Tutor & Doubt Solver: Unlimited",
      "Answer Explanations: Full Solutions with PIE AI",
      "Study Materials: Complete Digital Library with unlimited downloads",
      "Ranking & Analytics: Proctored National Percentile",
      "Supported Devices: 1 Active Device",
      "PIE LAB: Included (Unlimited Access)"
    ]
  }
];

export async function GET(req: Request) {
  try {
    let plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });

    // Auto-seed missing default active plans if needed
    if (plans.length === 0) {
      for (const p of DEFAULT_SUBSCRIPTION_PLANS) {
        await prisma.subscriptionPlan.create({
          data: {
            name: p.name,
            description: p.description,
            price: p.price,
            durationDays: p.durationDays,
            benefits: p.benefits,
            isActive: p.isActive
          }
        });
      }
      plans = await prisma.subscriptionPlan.findMany({
        orderBy: { price: 'asc' }
      });
    } else {
      // Check if PIE Ultra is missing and seed it
      const hasUltra = plans.some(p => p.name.toLowerCase().includes("ultra"));
      if (!hasUltra) {
        const ultraPlan = DEFAULT_SUBSCRIPTION_PLANS[2];
        await prisma.subscriptionPlan.create({
          data: {
            name: ultraPlan.name,
            description: ultraPlan.description,
            price: ultraPlan.price,
            durationDays: ultraPlan.durationDays,
            benefits: ultraPlan.benefits,
            isActive: ultraPlan.isActive
          }
        });
        plans = await prisma.subscriptionPlan.findMany({
          orderBy: { price: 'asc' }
        });
      }
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/admin/subscription-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Option to reset or seed default plans
    if (body.action === "seed_defaults") {
      await prisma.subscriptionPlan.deleteMany({});
      for (const p of DEFAULT_SUBSCRIPTION_PLANS) {
        await prisma.subscriptionPlan.create({
          data: {
            name: p.name,
            description: p.description,
            price: p.price,
            durationDays: p.durationDays,
            benefits: p.benefits,
            isActive: p.isActive
          }
        });
      }
      const seeded = await prisma.subscriptionPlan.findMany({ orderBy: { price: "asc" } });
      return NextResponse.json(seeded);
    }

    const { name, description, price, durationDays, benefits, isActive } = body;

    // Check active plans limit (max 5 active plans)
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
        price: parseFloat(price?.toString() || "0"),
        durationDays: parseInt(durationDays?.toString() || "30", 10),
        benefits: Array.isArray(benefits) ? benefits : (typeof benefits === "string" ? benefits.split("\n").filter(Boolean) : []),
        isActive: isActive ?? true
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("POST /api/admin/subscription-plans error:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

