import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, description, price, durationDays, benefits, isActive } = body;

    if (isActive) {
      const activeCount = await prisma.subscriptionPlan.count({
        where: { isActive: true, id: { not: id } }
      });
      if (activeCount >= 5) {
        return NextResponse.json({ error: "Maximum of 5 active plans allowed." }, { status: 400 });
      }
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price.toString()) : undefined,
        durationDays: durationDays !== undefined ? parseInt(durationDays.toString(), 10) : undefined,
        benefits,
        isActive
      }
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("PUT /api/admin/subscription-plans/[id] error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.subscriptionPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/subscription-plans/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
