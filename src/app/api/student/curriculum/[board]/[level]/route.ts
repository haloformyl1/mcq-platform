import { touchOrCreateStudentSession, getActiveStudentSessions } from "@/lib/sessionService";
﻿import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recalculateStudentAttempts } from "@/lib/recalculate";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { autoExpireSubscriptions } from "@/lib/subscription";

export const dynamic = 'force-dynamic';

function isRealStudent(student: { email: string; name?: string | null }) {
  if (!student || !student.email) return false;
  const emailLower = student.email.toLowerCase();
  if (emailLower.endsWith('@student.local') || emailLower.includes('admin.test')) return false;
  if (student.name && student.name.toLowerCase().includes('admin test')) return false;
  return true;
}

export async function GET(req: Request, { params }: { params: Promise<{ board: string, level: string }> }) {
  const resolvedParams = await params;
  const boardParam = decodeURIComponent(resolvedParams.board).toUpperCase();
  const levelParam = decodeURIComponent(resolvedParams.level).toUpperCase();
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
    const { deviceId, isRevoked } = await touchOrCreateStudentSession(studentId, req, cookieStore);
    if (isRevoked) {
      cookieStore.delete('session');
      return NextResponse.json({ error: "Session has been revoked" }, { status: 401 });
    }
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 400,
      path: '/',
    });
    await autoExpireSubscriptions();

    // Run attempt score check in the background without blocking the dashboard response
    recalculateStudentAttempts(studentId).catch(err => {
      console.error("Non-blocking attempt recalculation warning:", err?.message);
    });

    const student = await prisma.student.update({
      where: { id: studentId },
      data: { lastLogin: new Date() },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        phone: true, 
        gender: true, 
        dob: true, 
        board: true, 
        academicLevel: true, 
        status: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        avatarUrl: true,
        createdAt: true 
      }
    });

    const availableTests = await prisma.test.findMany({
      where: { 
        status: { in: ["LIVE", "UPCOMING", "PUBLISHED", "LOCKED", "EXPIRED", "SCHEDULE_EXPIRED"] }
      },
      select: {
        id: true,
        title: true,
        totalQuestions: true,
        durationMinutes: true,
        marksPerQuestion: true,
        negativeMarking: true,
        negativeMarks: true,
        status: true,
        unlockAt: true,
        lockAt: true,
        postLockHoldMinutes: true,
        maximumAttempts: true,
        targetBoard: true,
        targetAcademicLevel: true,
        isPremium: true,
        questionPaperUrl: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter tests by target audience (Board and Class/Semester eligibility)
    const eligibleTests = availableTests.filter(t => {
      if (t.targetBoard === "NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS" || t.targetBoard === "ALL" || !t.targetBoard) return true;

      const matchesBoard = t.targetBoard === boardParam;
      let matchesLevel = !t.targetAcademicLevel || t.targetAcademicLevel === "ALL" || t.targetAcademicLevel === levelParam;
      if (!matchesLevel && boardParam && levelParam && t.targetAcademicLevel) {
        const isCbseOrIcse = boardParam === "CBSE" || boardParam === "ICSE";
        if (isCbseOrIcse) {
          if (levelParam === "11" && (t.targetAcademicLevel === "SEM-I" || t.targetAcademicLevel === "SEM-II")) {
            matchesLevel = true;
          } else if (levelParam === "12" && (t.targetAcademicLevel === "SEM-III" || t.targetAcademicLevel === "SEM-IV")) {
            matchesLevel = true;
          }
        }
      }
      return matchesBoard && matchesLevel;
    });

    // Apply per-student overrides: prefer any StudentTestOverride for this student & test
    const overrides = await prisma.studentTestOverride.findMany({ where: { studentId } });
    const overridesMap: Record<string, any> = {};
    overrides.forEach(o => {
      overridesMap[o.testId] = o;
    });

    // Fetch access requests made by this student
    const requests = await prisma.testAccessRequest.findMany({ where: { studentId } });
    const requestsMap: Record<string, any> = {};
    requests.forEach(r => {
      requestsMap[r.testId] = r;
    });

    const availableTestsWithOverrides = eligibleTests.map(t => {
      const o = overridesMap[t.id];
      const r = requestsMap[t.id];
      const base = o ? {
        ...t,
        unlockAt: (o.overrideUnlockAt !== null && o.overrideUnlockAt !== undefined) ? o.overrideUnlockAt : t.unlockAt,
        lockAt: (o.overrideLockAt !== null && o.overrideLockAt !== undefined) ? o.overrideLockAt : t.lockAt
      } : t;
      return {
        ...base,
        hasIndividualAccess: !!o,
        userRequestStatus: r ? r.status : null
      };
    });

    const allAttempts = await prisma.testAttempt.findMany({
      where: { studentId },
      include: {
        test: {
          select: { title: true, totalQuestions: true }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // Top performers section removed
    const lastExamTopStudents: any[] = [];
    const lastExamTitle = "";

    
    let testAlertSettings = await prisma.testAlertSetting.findUnique({
      where: { id: "default" }
    });

    if (!testAlertSettings) {
      testAlertSettings = {
        id: "default",
        badgeText: "TEST ALERT",
        bgGradient: "from-amber-950/90 via-yellow-900/70 to-amber-950/90",
        badgeColor: "bg-amber-500 text-black",
        textColor: "text-amber-200",
        marqueeSpeed: "normal",
        customNotice: "",
        updatedAt: new Date()
      };
    }

    return NextResponse.json({
      student,
      availableTests: availableTestsWithOverrides,
      testAlertSettings,
      allAttempts,
      lastExamTopStudents,
      lastExamTitle
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
