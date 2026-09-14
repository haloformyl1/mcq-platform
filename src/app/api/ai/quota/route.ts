import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getAiQuotaStatus } from '@/lib/ai/aiQuota';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [quota, studentRecord] = await Promise.all([
      getAiQuotaStatus(student.id),
      prisma.student.findUnique({
        where: { id: student.id },
        select: { name: true, email: true }
      })
    ]);

    // Extract student's given name (first name)
    let givenName = 'Scholar';
    if (studentRecord?.name && studentRecord.name.trim()) {
      givenName = studentRecord.name.trim().split(/\s+/)[0];
    } else if (student.name && typeof student.name === 'string') {
      givenName = student.name.trim().split(/\s+/)[0];
    } else if (studentRecord?.email) {
      givenName = studentRecord.email.split('@')[0];
    }

    return NextResponse.json({
      success: true,
      quota: {
        ...quota,
        totalLimit: quota.totalLimit,
        dailyLimit: quota.totalLimit
      },
      studentName: givenName
    });
  } catch (err: any) {
    console.error('AI Quota Route Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve AI quota status' }, { status: 500 });
  }
}
