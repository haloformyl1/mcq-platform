import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    let adminSession = cookieStore.get("admin_session")?.value;
    // allow passing a Bearer token in Authorization header for local testing
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    if (!adminSession && process.env.NODE_ENV === 'development' && authHeader.startsWith('Bearer ')) {
      adminSession = authHeader.replace(/^Bearer\s+/i, '');
    }

    if (!adminSession) {
      console.warn('Override POST: missing admin_session cookie');
      return NextResponse.json({ error: "Unauthorized", debug: { cookiePresent: false } }, { status: 401 });
    }

    let payload = adminSession ? await decrypt(adminSession) : null;
    if ((!payload || !payload.id) && process.env.NODE_ENV === 'development') {
      console.warn('Override POST: development bypass of admin auth');
      payload = { id: 'dev-admin', role: 'admin' } as any;
    }
    if (!payload || !payload.id) {
      console.warn('Override POST: invalid admin session', { payload });
      const debug = process.env.NODE_ENV === 'development' ? { payload } : undefined;
      return NextResponse.json({ error: "Unauthorized", debug }, { status: 401 });
    }
    const params = await context.params;
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
    console.error('Override POST error', error);
    const devDetail = process.env.NODE_ENV === 'development' ? String(error) : undefined;
    return NextResponse.json({ error: 'Failed to save override', detail: devDetail }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    let adminSession = cookieStore.get("admin_session")?.value;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    if (!adminSession && process.env.NODE_ENV === 'development' && authHeader.startsWith('Bearer ')) {
      adminSession = authHeader.replace(/^Bearer\s+/i, '');
    }
    if (!adminSession) {
      console.warn('Override DELETE: missing admin_session cookie');
      return NextResponse.json({ error: "Unauthorized", debug: { cookiePresent: false } }, { status: 401 });
    }
    let payload = adminSession ? await decrypt(adminSession) : null;
    if ((!payload || !payload.id) && process.env.NODE_ENV === 'development') {
      console.warn('Override DELETE: development bypass of admin auth');
      payload = { id: 'dev-admin', role: 'admin' } as any;
    }
    if (!payload || !payload.id) {
      console.warn('Override DELETE: invalid admin session', { payload });
      const debug = process.env.NODE_ENV === 'development' ? { payload } : undefined;
      return NextResponse.json({ error: "Unauthorized", debug }, { status: 401 });
    }
    const params = await context.params;
    const studentId = params.id;
    const body = await req.json();
    const { testId } = body;
    if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });

    await prisma.studentTestOverride.deleteMany({ where: { studentId, testId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Override DELETE error', error);
    const devDetail = process.env.NODE_ENV === 'development' ? String(error) : undefined;
    return NextResponse.json({ error: 'Failed to delete override', detail: devDetail }, { status: 500 });
  }
}
