"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ContinueChatButton({ 
  originalConversationId, 
  isOwner = false,
  pendingRequests = []
}: { 
  originalConversationId: string,
  isOwner?: boolean,
  pendingRequests?: any[]
}) {
  const [loading, setLoading] = useState<'duplicate' | 'collab' | string | null>(null);
  const router = useRouter();

  const handleContinue = async () => {
    setLoading('duplicate');
    try {
      const res = await fetch("/api/ai/conversations/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalConversationId })
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        router.push(`/dashboard/ai?chatId=${data.conversation.id}`);
      } else {
        alert("Failed to continue chat: " + data.error);
        setLoading(null);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
      setLoading(null);
    }
  };

  const handleCollab = async () => {
    setLoading('collab');
    try {
      const res = await fetch("/api/ai/conversations/collab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalConversationId })
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        if (data.status === 'pending') {
          alert("Collaboration requested! Waiting for owner to accept.");
          setLoading(null);
        } else {
          router.push(`/dashboard/ai?chatId=${data.conversation.id}`);
        }
      } else {
        alert("Failed to collab chat: " + data.error);
        setLoading(null);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
      setLoading(null);
    }
  };

  const handleRespondCollab = async (collabUserId: string, accept: boolean) => {
    setLoading(`respond-${collabUserId}`);
    try {
      const res = await fetch("/api/ai/conversations/collab/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: originalConversationId, collabUserId, accept })
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        alert("Failed to respond: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const [showConfirm, setShowConfirm] = useState<'duplicate' | 'collab' | null>(null);

  if (isOwner) {
    if (pendingRequests.length === 0) {
      return (
        <button
          onClick={() => router.push(`/dashboard/ai?chatId=${originalConversationId}`)}
          className="px-8 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-sm font-medium transition shadow-[0_4px_14px_0_rgba(11,87,208,0.39)]"
        >
          Open in Dashboard
        </button>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {pendingRequests.map(req => (
          <div key={req.collabUserId} className="flex items-center justify-between gap-4 bg-[#1e1f20] border border-white/10 px-5 py-3 rounded-2xl shadow-xl">
            <div className="text-sm text-[#e3e3e3]">
              <span className="font-semibold">{req.name}</span> requested to collab
            </div>
            <div className="flex gap-2">
              <Link
                href="/collab-info"
                target="_blank"
                className="px-4 py-1.5 rounded-full bg-[#282a2c] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center"
              >
                Know more
              </Link>
              <button
                onClick={() => handleRespondCollab(req.collabUserId, false)}
                disabled={!!loading}
                className="px-4 py-1.5 rounded-full bg-[#282a2c] hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition"
              >
                Decline
              </button>
              <button
                onClick={() => handleRespondCollab(req.collabUserId, true)}
                disabled={!!loading}
                className="px-4 py-1.5 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-xs font-medium transition"
              >
                {loading === `respond-${req.collabUserId}` ? "..." : "Accept"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (showConfirm === 'duplicate') {
    return (
      <div className="flex flex-col gap-4 max-w-md w-full bg-[#1e1f20] p-6 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
        <h3 className="text-[18px] font-semibold text-white tracking-tight">Duplicate Chat</h3>
        <p className="text-[14px] text-slate-300 leading-relaxed">
          This will create a personal copy of this conversation in your own account. 
          You can continue interacting with the AI independently, and your future messages won't affect the original chat.
        </p>
        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            onClick={() => setShowConfirm(null)}
            disabled={!!loading}
            className="px-5 py-2.5 rounded-full bg-[#282a2c] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!!loading}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-200 text-black text-sm font-medium transition disabled:opacity-70 flex items-center gap-2"
          >
            {loading === 'duplicate' ? "Preparing..." : "Proceed"}
          </button>
        </div>
      </div>
    );
  }

  if (showConfirm === 'collab') {
    return (
      <div className="flex flex-col gap-4 max-w-md w-full bg-[#1e1f20] p-6 rounded-2xl border border-[#0b57d0]/30 shadow-[0_8px_30px_rgb(11,87,208,0.12)] animate-in fade-in zoom-in-95 duration-200 text-left">
        <h3 className="text-[18px] font-semibold text-white tracking-tight flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#4285f4]"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Collab this chat
        </h3>
        <p className="text-[14px] text-slate-300 leading-relaxed">
          This will send a request to the owner of this chat. Once accepted, you will be able to join the original conversation in real-time and interact alongside other collaborators.
        </p>
        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            onClick={() => setShowConfirm(null)}
            disabled={!!loading}
            className="px-5 py-2.5 rounded-full bg-[#282a2c] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition"
          >
            Back
          </button>
          <button
            onClick={handleCollab}
            disabled={!!loading}
            className="px-5 py-2.5 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-sm font-medium transition shadow-lg disabled:opacity-70 flex items-center gap-2"
          >
            {loading === 'collab' ? "Sending Request..." : "Proceed"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
      <button
        onClick={() => setShowConfirm('duplicate')}
        className="px-6 py-3 rounded-full bg-[#282a2c] hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition flex items-center justify-center min-w-[200px] w-full sm:w-auto"
      >
        Duplicate to my account
      </button>
      <button
        onClick={() => setShowConfirm('collab')}
        className="px-6 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 text-white text-sm font-medium transition shadow-[0_4px_14px_0_rgba(11,87,208,0.39)] hover:shadow-[0_6px_20px_rgba(11,87,208,0.23)] hover:-translate-y-0.5 flex items-center justify-center min-w-[200px] w-full sm:w-auto"
      >
        Collab this chat
      </button>
    </div>
  );
}
