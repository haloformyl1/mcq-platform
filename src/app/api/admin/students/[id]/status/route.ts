import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, subscriptionStatus } = body;
    
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData: any = {};

    if (status) {
      if (status !== "ACTIVE" && status !== "SUSPENDED") {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = status;
    }

    if (subscriptionStatus) {
      if (subscriptionStatus !== "FREE" && subscriptionStatus !== "PAID") {
        return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 });
      }
      updateData.subscriptionStatus = subscriptionStatus;
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ 
      success: true, 
      student: { 
        id: updatedStudent.id, 
        status: updatedStudent.status,
        subscriptionStatus: updatedStudent.subscriptionStatus 
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update student status" }, { status: 500 });
  }
}
