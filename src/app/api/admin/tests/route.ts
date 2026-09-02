import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    const payload = adminSession ? await decrypt(adminSession) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
        try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Test" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "StudyMaterial" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "SubscriptionUpgradeRequest" ADD COLUMN IF NOT EXISTS "utrNumber" TEXT, ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION DEFAULT 99.0;`);
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "PaymentSetting" ("id" TEXT NOT NULL PRIMARY KEY, "upiId" TEXT NOT NULL DEFAULT '9830507435@upi', "payeeName" TEXT NOT NULL DEFAULT 'Arghyadeep Roy', "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 99.0, "qrImageUrl" TEXT DEFAULT '', "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
    } catch (e) { console.error("Self migration note:", e); }

    const tests = await prisma.test.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      }
    });
    return NextResponse.json(tests);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error); console.error("Error fetching tests:", error); return NextResponse.json({ error: "Failed to fetch tests: " + msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const test = await prisma.test.create({
      data: {
        title: data.title,
        description: data.description,
        durationMinutes: parseInt(data.durationMinutes),
        totalQuestions: parseInt(data.totalQuestions) || 50,
        marksPerQuestion: parseFloat(data.marksPerQuestion) || 1,
        negativeMarking: data.negativeMarking || false,
        negativeMarks: parseFloat(data.negativeMarks) || 0,
        randomizeQuestions: data.randomizeQuestions || false,
        randomizeOptions: data.randomizeOptions || false,
        targetBoard: data.targetBoard || "ALL",
        targetAcademicLevel: data.targetAcademicLevel || "ALL",
      },
    });
    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 });
  }
}
