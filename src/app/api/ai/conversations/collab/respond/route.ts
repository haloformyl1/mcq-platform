import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, collabUserId, accept } = await req.json();
    if (!conversationId || !collabUserId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // Only owner can respond
    const original = await prisma.aiConversation.findUnique({
      where: { id: conversationId }
    });

    if (!original || original.studentId !== student.id) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    let messages = Array.isArray(original.messages) ? original.messages as any[] : [];
    let updated = false;

    if (accept) {
      messages = messages.map(m => {
        if (m.type === 'collab_request' && m.collabUserId === collabUserId) {
          updated = true;
          return { ...m, type: 'collaborator', content: `User ${m.name || m.collabUserId} joined the collaboration.` };
        }
        return m;
      });
    } else {
      const prevLength = messages.length;
      messages = messages.filter(m => !(m.type === 'collab_request' && m.collabUserId === collabUserId));
      if (messages.length !== prevLength) updated = true;
    }

    if (updated) {
      await prisma.aiConversation.update({
        where: { id: original.id },
        data: { messages: messages as any }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error responding to collab:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
