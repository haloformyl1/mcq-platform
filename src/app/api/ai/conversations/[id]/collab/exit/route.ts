import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Find the original conversation
    const original = await prisma.aiConversation.findUnique({
      where: { id: conversationId }
    });

    if (!original) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    // Owner cannot "exit" a collab, they must revert it instead.
    if (original.studentId === student.id) {
      return NextResponse.json({ success: false, error: 'Owner cannot exit collaboration. Use revert instead.' }, { status: 403 });
    }

    const messages = Array.isArray(original.messages) ? original.messages as any[] : [];

    // Filter out the collaborator's entry
    const updatedMessages = messages.filter(
      (m: any) => !(m.type === 'collaborator' && m.collabUserId === student.id)
    );

    // If length didn't change, they weren't in it
    if (updatedMessages.length === messages.length) {
      return NextResponse.json({ success: false, error: 'Not an active collaborator' }, { status: 400 });
    }

    // Append a system message that the user left
    updatedMessages.push({
      id: `collab-exit-${student.id}-${Date.now()}`,
      role: 'system',
      type: 'collab_exit',
      collabUserId: student.id,
      timestamp: new Date().toISOString(),
      content: `User ${student.name || student.email || student.id} has left the collaboration.`
    });

    await prisma.aiConversation.update({
      where: { id: original.id },
      data: {
        messages: updatedMessages as any
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error exiting collaboration:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
