import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateConversationTitle } from '@/lib/ai/conversationUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();

    const conversations = await prisma.aiConversation.findMany({
      where: {
        OR: [
          { studentId: student.id },
          {
            messages: {
              array_contains: [{ type: 'collaborator', collabUserId: student.id }] as any
            }
          }
        ],
        ...(search ? {
          title: { contains: search, mode: 'insensitive' }
        } : {})
      },
      select: {
        id: true,
        title: true,
        subject: true,
        level: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 60,
    });

    return NextResponse.json({
      success: true,
      conversations: conversations.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))
    });
  } catch (error: any) {
    console.error('Error fetching AI conversations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, subject, level, messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'Messages are required to save conversation' }, { status: 400 });
    }

    // Generate smart title if not explicitly provided or generic
    let finalTitle = title;
    if (!finalTitle || finalTitle.trim() === '' || finalTitle === 'New Chat' || finalTitle === 'Untitled') {
      const firstUserMsg = messages.find((m: any) => m.role === 'user');
      finalTitle = generateConversationTitle(firstUserMsg?.content || 'STEM Conversation');
    }

    // If ID provided, check if existing
    if (id) {
      const existing = await prisma.aiConversation.findUnique({
        where: { id }
      });

      if (existing) {
        const isOwner = existing.studentId === student.id;
        const isCollab = Array.isArray(existing.messages) && (existing.messages as any[]).some(m => m.type === 'collaborator' && m.collabUserId === student.id);

        const oldMessages = (Array.isArray(existing.messages) ? existing.messages : []) as any[];
        const newMessagesList = messages as any[];

        const taggedMessages = newMessagesList.map(newMsg => {
          const oldMsg = oldMessages.find((m: any) => m.id === newMsg.id);
          if (oldMsg) {
            // Preserve existing senderId, or default to owner if it was missing (legacy)
            return { ...newMsg, senderId: oldMsg.senderId || existing.studentId };
          } else {
            // It's a brand new message added in this request!
            return { ...newMsg, senderId: student.id };
          }
        });

        if (isOwner || isCollab) {
          const updated = await prisma.aiConversation.update({
            where: { id },
            data: {
              title: finalTitle,
              subject: subject || existing.subject,
              level: level || existing.level,
              messages: taggedMessages,
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
        } else {
          return NextResponse.json({ success: false, error: 'Unauthorized to update this conversation' }, { status: 403 });
        }
      }
    }

    // Otherwise create new conversation
    const initialTaggedMessages = (messages as any[]).map(m => ({ ...m, senderId: student.id }));
    const created = await prisma.aiConversation.create({
      data: {
        id: id || undefined,
        studentId: student.id,
        title: finalTitle,
        subject: subject || 'stem',
        level: level || 'intermediate',
        messages: initialTaggedMessages,
      }
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: created.id,
        title: created.title,
        subject: created.subject,
        level: created.level,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error saving AI conversation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
