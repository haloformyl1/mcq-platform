import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { autoExpireSubscriptions } from "@/lib/subscription";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-expire any overdue subscriptions
    await autoExpireSubscriptions();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status !== 'ALL') {
      where.status = status;
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: { attempts: true }
        },
        upgradeRequests: {
          where: { status: "APPROVED", utrNumber: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    const formattedStudents = students.map((s) => {
      const hasActiveUpi = s.subscriptionStatus === "PAID" &&
        s.subscriptionExpiresAt &&
        new Date(s.subscriptionExpiresAt) > new Date() &&
        s.upgradeRequests && s.upgradeRequests.length > 0;

      return {
        ...s,
        hasActiveUpi: !!hasActiveUpi
      };
    });

    const totalStudents = await prisma.student.count();
    const activeStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const suspendedStudents = await prisma.student.count({ where: { status: 'SUSPENDED' } });

    return NextResponse.json({
      students: formattedStudents,
      stats: {
        totalStudents,
        activeStudents,
        suspendedStudents,
      }
    });
  } catch (error) {
    console.error("Fetch students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}