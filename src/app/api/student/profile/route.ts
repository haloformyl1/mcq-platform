import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await decrypt(session);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.id;
    const body = await req.json();
    const { name, phone, gender, dob, board, academicLevel, avatarUrl } = body;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(gender !== undefined && { gender }),
        ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
        ...(board !== undefined && { board }),
        ...(academicLevel !== undefined && { academicLevel }),
        ...(avatarUrl !== undefined && { avatarUrl })
      }
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        gender: updatedStudent.gender,
        dob: updatedStudent.dob,
        board: updatedStudent.board,
        academicLevel: updatedStudent.academicLevel,
        avatarUrl: updatedStudent.avatarUrl
      }
    });
  } catch (error: any) {
    console.error("Error updating student profile:", error);
    return NextResponse.json({ error: "Failed to update profile details" }, { status: 500 });
  }
}
