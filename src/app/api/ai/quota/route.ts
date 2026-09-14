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

    // Fetch dynamic gold membership price set by Admin in PaymentSetting
    const paymentSetting = await prisma.paymentSetting.findUnique({
      where: { id: 'default' },
      select: { monthlyFee: true }
    });
    const goldPrice = paymentSetting?.monthlyFee ? Math.round(paymentSetting.monthlyFee) : 199;

    if (!student || !student.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        goldPrice,
        quota: {
          allowed: false,
          isUnlimited: false,
          remaining: 0,
          totalLimit: 5,
          dailyLimit: 5,
          queriesUsed: 0
        },
        studentName: 'Scholar'
      }, { status: 401 });
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
      studentName: givenName,
      goldPrice
    });
  } catch (err: any) {
    console.error('AI Quota Route Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve AI quota status', goldPrice: 199 }, { status: 500 });
  }
}
