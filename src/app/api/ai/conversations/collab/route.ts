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

    // Fetch the real student record from DB to get their actual name
    const studentDb = await prisma.student.findUnique({
      where: { id: student.id },
      select: { name: true, email: true }
    });

    const realName = studentDb?.name || student.email || "Someone";

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

    // Check if they are already a collaborator or requested
    const messages = Array.isArray(original.messages) ? original.messages : [];
    const isAlreadyCollab = messages.some((m: any) => m.type === 'collaborator' && m.collabUserId === student.id);
    const hasPendingRequest = messages.some((m: any) => m.type === 'collab_request' && m.collabUserId === student.id);

    if (isAlreadyCollab || hasPendingRequest) {
      return NextResponse.json({ success: true, status: isAlreadyCollab ? 'accepted' : 'pending', conversation: { id: original.id } });
    }

    // Add them as a pending collaborator by pushing a hidden system message
    const updatedMessages = [
      ...messages,
      {
        id: `collab-req-${student.id}-${Date.now()}`,
        role: "system",
        type: "collab_request",
        collabUserId: student.id,
        name: realName,
        email: student.email,
        timestamp: new Date().toISOString(),
        content: `User ${realName} requested to collaborate.`
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
