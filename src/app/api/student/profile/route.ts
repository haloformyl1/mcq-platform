import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { validateStudentName, verifyNameWithAI } from "@/lib/nameValidation";

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

    let sanitizedName = name;
    if (name !== undefined) {
      const validation = validateStudentName(name);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error || "Invalid student name." }, { status: 400 });
      }
      sanitizedName = validation.sanitizedName;

      const aiCheck = await verifyNameWithAI(sanitizedName || name);
      if (!aiCheck.isValid) {
        return NextResponse.json({
          error: aiCheck.reason || "Inappropriate or offensive names are strictly prohibited. Please enter your genuine student name."
        }, { status: 400 });
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(name !== undefined && { name: sanitizedName }),
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
