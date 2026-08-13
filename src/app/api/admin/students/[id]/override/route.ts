import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    if (!adminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await decrypt(adminSession);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const studentId = params.id;
    const body = await req.json();
    const { testId, unlockAt, lockAt } = body;
    if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });

    const data: any = {};
    if (unlockAt) data.overrideUnlockAt = new Date(unlockAt);
    if (lockAt) data.overrideLockAt = new Date(lockAt);

    const existing = await prisma.studentTestOverride.findUnique({
      where: { studentId_testId: { studentId, testId } }
    });

    let result;
    if (existing) {
      result = await prisma.studentTestOverride.update({ where: { id: existing.id }, data });
    } else {
      result = await prisma.studentTestOverride.create({ data: { studentId, testId, ...data } });
    }

    return NextResponse.json({ ok: true, override: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save override' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session")?.value;
    if (!adminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await decrypt(adminSession);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const studentId = params.id;
    const body = await req.json();
    const { testId } = body;
    if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });

    await prisma.studentTestOverride.deleteMany({ where: { studentId, testId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete override' }, { status: 500 });
  }
}
