import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id,
        studentId: student.id,
      }
    });

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        subject: conversation.subject,
        level: conversation.level,
        messages: conversation.messages,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'Valid title is required' }, { status: 400 });
    }

    const existing = await prisma.aiConversation.findFirst({
      where: { id, studentId: student.id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const updated = await prisma.aiConversation.update({
      where: { id },
      data: {
        title: title.trim(),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: updated.id,
        title: updated.title,
        subject: updated.subject,
        level: updated.level,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error renaming conversation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.aiConversation.findFirst({
      where: { id, studentId: student.id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    await prisma.aiConversation.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
