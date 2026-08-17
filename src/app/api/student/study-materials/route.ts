import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Fetch study materials error:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}
