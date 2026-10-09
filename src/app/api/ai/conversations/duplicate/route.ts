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

    // Duplicate it for the new user
    const newConv = await prisma.aiConversation.create({
      data: {
        studentId: student.id,
        title: original.title,
        subject: original.subject,
        level: original.level,
        messages: original.messages as any, // json type
      }
    });

    return NextResponse.json({ success: true, conversation: { id: newConv.id } });
  } catch (error: any) {
    console.error('Error duplicating conversation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
