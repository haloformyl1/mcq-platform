import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const testId = params.id;
    const body = await req.json();
    const { questionPaperUrl } = body;

    const test = await prisma.test.update({
      where: { id: testId },
      data: { questionPaperUrl },
    });

    return NextResponse.json(test);
  } catch (error: any) {
    console.error("Update question paper error:", error);
    return NextResponse.json({ error: "Failed to update question paper" }, { status: 500 });
  }
}
