import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testIds, targetBoard, targetAcademicLevel } = await req.json();

    if (!Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json({ error: "No tests selected for bulk update." }, { status: 400 });
    }

    const board = targetBoard || "ALL";
    const level = targetAcademicLevel || "ALL";

    const result = await prisma.test.updateMany({
      where: { id: { in: testIds } },
      data: {
        targetBoard: board,
        targetAcademicLevel: level,
      },
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      targetBoard: board,
      targetAcademicLevel: level
    });
  } catch (error) {
    console.error("Bulk target audience update error:", error);
    return NextResponse.json({ error: "Failed to update target audience for selected tests." }, { status: 500 });
  }
}
