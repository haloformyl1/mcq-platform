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

    const { originalConversationId } = await req.json();
    if (!originalConversationId) {
      return NextResponse.json({ success: false, error: 'Missing conversation ID' }, { status: 400 });
    }

    // Find the original conversation
    const original = await prisma.aiConversation.findUnique({
      where: { id: originalConversationId }
    });

    if (!original) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    // If they already own it, just redirect them to it
    if (original.studentId === student.id) {
      return NextResponse.json({ success: true, conversation: { id: original.id } });
    }

    // Check if they are already a collaborator
    const messages = Array.isArray(original.messages) ? original.messages : [];
    const isAlreadyCollab = messages.some((m: any) => m.type === 'collaborator' && m.collabUserId === student.id);

    if (isAlreadyCollab) {
      return NextResponse.json({ success: true, conversation: { id: original.id } });
    }

    // Add them as a collaborator by pushing a hidden system message
    const updatedMessages = [
      ...messages,
      {
        id: `collab-${student.id}-${Date.now()}`,
        role: "system",
        type: "collaborator",
        collabUserId: student.id,
        timestamp: new Date().toISOString(),
        content: `User ${student.name || student.id} joined the collaboration.`
      }
    ];

    await prisma.aiConversation.update({
      where: { id: original.id },
      data: {
        messages: updatedMessages as any
      }
    });

    return NextResponse.json({ success: true, conversation: { id: original.id } });
  } catch (error: any) {
    console.error('Error collaborating conversation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
