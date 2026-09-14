import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getAiQuotaStatus } from '@/lib/ai/aiQuota';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quota = await getAiQuotaStatus(student.id);
    return NextResponse.json({ success: true, quota });
  } catch (err: any) {
    console.error('AI Quota Route Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve AI quota status' }, { status: 500 });
  }
}
