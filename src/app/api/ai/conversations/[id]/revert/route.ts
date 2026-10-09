import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const student = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!student || !student.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.aiConversation.findUnique({
      where: { id }
    });

    if (!existing || existing.studentId !== student.id) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const messages = Array.isArray(existing.messages) ? existing.messages as any[] : [];

    // Check if there's at least one accepted collaborator
    const hasCollab = messages.some(m => m.type === 'collaborator');
    if (!hasCollab) {
      return NextResponse.json({ success: false, error: 'No active collaborators to revert' }, { status: 400 });
    }

    // Filter out third-party messages and collab status messages
    const revertedMessages = messages.filter(m => {
      // Remove all collaboration status updates
      if (m.type === 'collaborator' || m.type === 'collab_request' || m.type === 'collab_revert') {
        return false;
      }
      
      // If it's a chat message, remove if it was sent by someone else
      if ((m.role === 'user' || m.role === 'assistant') && m.senderId && m.senderId !== student.id) {
        return false;
      }
      
      return true;
    });

    // Add a silent system message that only the owner sees, acknowledging the revert
    // But actually, we don't even need a system message. By removing the 'collaborator' tags, 
    // the chat instantly drops from other users' GET /api/ai/conversations queries!
    
    const updated = await prisma.aiConversation.update({
      where: { id },
      data: {
        messages: revertedMessages,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error: any) {
    console.error('Error reverting conversation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
