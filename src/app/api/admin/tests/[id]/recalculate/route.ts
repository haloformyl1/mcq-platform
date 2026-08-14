import { NextResponse } from "next/server";
import { recalculateTestAttempts } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await recalculateTestAttempts(params.id);
    return NextResponse.json({ success: true, message: "Scores recalculated successfully" });
  } catch (error) {
    console.error("Recalculate error:", error);
    return NextResponse.json({ error: "Failed to recalculate test scores" }, { status: 500 });
  }
}
