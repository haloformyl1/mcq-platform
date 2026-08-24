import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const payload = await decrypt(session);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.id;
    const { currentPassword, otp, newPassword } = await req.json();

    if (!otp) {
      return NextResponse.json({ error: "Verification OTP is required to change password." }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: "New password is required." }, { status: 400 });
    }

    // Server-side Password Policy Validation
    const reqLength = newPassword.length >= 8;
    const reqUpper = /[A-Z]/.test(newPassword);
    const reqLower = /[a-z]/.test(newPassword);
    const reqNumber = /[0-9]/.test(newPassword);
    const reqSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!reqLength || !reqUpper || !reqLower || !reqNumber || !reqSpecial) {
      return NextResponse.json({
        error: "New password does not meet the security policy requirements (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)."
      }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json({ error: "Student account not found." }, { status: 404 });
    }

    // Verify OTP
    if (!student.otp || student.otp !== otp.trim()) {
      return NextResponse.json({ error: "Invalid verification OTP code. Please check your email." }, { status: 400 });
    }

    if (!student.otpExpiry || new Date() > student.otpExpiry) {
      return NextResponse.json({ error: "Verification OTP has expired. Please request a new OTP." }, { status: 400 });
    }

    // If student has an existing password, verify current password if provided
    if (student.passwordHash && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, student.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password entered is incorrect." }, { status: 400 });
      }
    }

    // Hash new password and clear OTP
    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.student.update({
      where: { id: studentId },
      data: {
        passwordHash: newHash,
        otp: null,
        otpExpiry: null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully!"
    });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
