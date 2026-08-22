import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { recalculateStudentAttempts } from "@/lib/recalculate";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await recalculateStudentAttempts(id);

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attempts: {
          include: { test: true },
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Compute examination statistics
    const completedAttempts = student.attempts.filter(a => a.status === "SUBMITTED");
    const totalAttempted = student.attempts.length;
    const totalCompleted = completedAttempts.length;
    const averageScore = totalCompleted > 0 ? completedAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalCompleted : 0;
    const highestScore = totalCompleted > 0 ? Math.max(...completedAttempts.map(a => a.score || 0)) : 0;
    const lowestScore = totalCompleted > 0 ? Math.min(...completedAttempts.map(a => a.score || 0)) : 0;

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        dob: student.dob,
        board: student.board,
        academicLevel: student.academicLevel,
        status: student.status,
        subscriptionStatus: student.subscriptionStatus,
        createdAt: student.createdAt,
        lastLogin: student.lastLogin,
      },
      statistics: {
        totalAttempted,
        totalCompleted,
        averageScore,
        highestScore,
        lowestScore,
      },
      history: student.attempts.map(a => ({
        id: a.id,
        testName: a.test.title,
        testId: a.test.id,
        date: a.startedAt,
        score: a.score,
        percentage: a.percentage,
        attemptNumber: a.attemptNumber,
        status: a.status
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Thanks to onDelete: Cascade in prisma schema, deleting the student will delete their TestAttempts and Answers
    await prisma.student.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Student and all associated data permanently deleted." });
  } catch (error) {
    console.error("Delete Student Error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
