import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import Link from "next/link";
import FormattedAiMessage from "@/components/ai/FormattedAiMessage";
import PiechemLogo from "@/components/PiechemLogo";
import { Share, Copy, Flag, User, Sparkles } from "lucide-react";
import ContinueChatButton from "./ContinueChatButton";

export async function generateMetadata({ params }: { params: Promise<{ chatId: string }> }): Promise<Metadata> {
  const { chatId } = await params;
  const conversation = await prisma.aiConversation.findUnique({
    where: { id: chatId }
  });
  if (!conversation) return { title: "Chat not found" };
  return { title: conversation.title };
}

export default async function SharedChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const conversation = await prisma.aiConversation.findUnique({
    where: { id: chatId }
  });

  if (!conversation) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  const student = sessionCookie ? await decrypt(sessionCookie) : null;
  const isLoggedIn = !!(student && student.id);
  const isOwner = isLoggedIn && conversation.studentId === student?.id;

  const createdDate = new Date(conversation.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const createdTime = new Date(conversation.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const messages = Array.isArray(conversation.messages) ? conversation.messages as any[] : [];
  
  const pendingRequests = isOwner ? messages.filter(m => m.type === 'collab_request') : [];

  return (
    <div className="min-h-screen bg-[#131314] text-slate-200 font-sans selection:bg-white/20">
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
          <PiechemLogo size="sm" showText={true} />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition hidden sm:block">About PIECHEM AI</Link>
          {!isLoggedIn ? (
            <Link href={`/login?redirect=/share/${conversation.id}`} className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-lg shadow-blue-500/20">
              Sign in
            </Link>
          ) : (
            <Link href="/dashboard/ai" className="px-5 py-2 rounded-full bg-[#282a2c] hover:bg-white/10 text-white text-sm font-medium transition border border-white/10">
              Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-32">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-normal text-white mb-4 tracking-tight leading-tight">{conversation.title}</h1>
          <div className="flex items-center gap-4 text-[#c4c7c5] mb-6">
            <span className="text-sm hover:underline cursor-pointer transition text-[#a8c7fa] truncate max-w-[200px] sm:max-w-md">
              https://piechem.vercel.app/share/{conversation.id}
            </span>
            <button className="p-1.5 rounded-md hover:bg-white/10 transition text-[#c4c7c5]" title="Copy link">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-white/10 transition text-[#c4c7c5]" title="Report">
              <Flag className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-[#c4c7c5]">
            Created with PIECHEM AI {createdDate} at {createdTime}
          </div>
        </div>

        <div className="space-y-8">
          {messages.map((msg, idx) => (
            <div key={msg.id || idx} className="flex gap-4 sm:gap-6">
              <div className="shrink-0 pt-1">
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {msg.role === 'user' ? (
                  <div className="inline-block bg-[#1e1f20] border border-white/5 rounded-3xl px-5 py-3.5 text-[#e3e3e3] text-[15px] leading-relaxed max-w-[85%] whitespace-pre-wrap">
                    {msg.content}
                  </div>
                ) : (
                  <div className="prose prose-invert prose-slate max-w-none text-[#e3e3e3]">
                    <FormattedAiMessage content={msg.content} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pointer-events-none flex justify-center pb-8 z-50">
        <div className="pointer-events-auto">
          {!isLoggedIn ? (
            <Link 
              href={`/login?redirect=/share/${conversation.id}`}
              className="px-8 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-sm font-medium transition shadow-[0_4px_14px_0_rgba(11,87,208,0.39)] hover:shadow-[0_6px_20px_rgba(11,87,208,0.23)] hover:-translate-y-0.5"
            >
              Sign in
            </Link>
          ) : (
            <ContinueChatButton originalConversationId={conversation.id} isOwner={isOwner} pendingRequests={pendingRequests} />
          )}
        </div>
      </div>
    </div>
  );
}
