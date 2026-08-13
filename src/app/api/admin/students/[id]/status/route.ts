import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, student: { id: updatedStudent.id, status: updatedStudent.status } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update student status" }, { status: 500 });
  }
}
