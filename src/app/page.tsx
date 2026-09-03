import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cookieStore = await cookies();

  // Check student session
  const session = cookieStore.get('session')?.value;
  if (session) {
    const payload = await decrypt(session);
    if (payload && payload.id) {
      const student = await prisma.student.findUnique({
        where: { id: payload.id },
        select: { id: true, board: true, academicLevel: true, status: true },
      });

      if (student && student.status !== 'SUSPENDED') {
        if (student.board && student.academicLevel) {
          redirect('/dashboard');
        } else {
          redirect('/onboarding');
        }
      }
    }
  }

  // Check admin session
  const adminSession = cookieStore.get('admin_session')?.value;
  if (adminSession) {
    const payload = await decrypt(adminSession);
    if (payload && (payload.role === 'admin' || payload.username)) {
      redirect('/admin/dashboard');
    }
  }

  redirect('/login');
}