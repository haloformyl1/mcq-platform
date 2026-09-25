import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { sendStudentPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword, notifyStudent } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    await prisma.student.update({
      where: { id },
      data: {
        passwordHash,
      },
    });

    // Revoke previous sessions so old devices are forced to re-login
    try {
      await prisma.studentSession.deleteMany({
        where: { studentId: id },
      });
    } catch (sessionErr) {
      console.warn("Failed to clear student sessions:", sessionErr);
    }

    // If notification requested, dispatch email
    let emailSent = false;
    if (notifyStudent && student.email) {
      try {
        emailSent = await sendStudentPasswordResetEmail({
          email: student.email,
          name: student.name,
          temporaryPassword: newPassword.trim(),
        });
      } catch (mailErr) {
        console.warn("Failed to dispatch password notification email:", mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Password successfully updated for ${student.name || student.email}.`,
      emailSent,
    });
  } catch (error) {
    console.error("Admin Reset Password Error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
