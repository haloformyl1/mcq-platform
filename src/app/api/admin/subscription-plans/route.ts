import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    name: "Basic",
    description: "Foundational practice tier for chemistry students",
    price: 0,
    durationDays: 30,
    isActive: true,
    benefits: [
      "Chemistry Exam Tests: Selected tests are free.",
      "AI Tutor & Doubt Solver: Basic Access (5 queries / day)",
      "Answer Explanations: Standard Answer Key",
      "Study Materials: Selected Free Chapters",
      "Ranking & Analytics: Basic Score Summary",
      "Supported Devices: 1 Active Device"
    ]
  },
  {
    name: "PIECHEM Pro",
    description: "Full access to 50+ exams, 3D models & proctored rankings",
    price: 299,
    durationDays: 30,
    isActive: true,
    benefits: [
      "Chemistry Exam Tests: Unlimited",
      "AI Tutor & Doubt Solver: Unlimited AI Access",
      "Answer Explanations: Full Solutions & 3D Models",
      "Study Materials: Complete Digital Library",
      "Ranking & Analytics: Proctored National Percentile",
      "Supported Devices: Mobile, Tablet, PC / Laptop (Max 2 devices)"
    ]
  }
];

export async function GET(req: Request) {
  try {
    let plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });

    // Auto-seed the two default active plans if none exist yet
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

