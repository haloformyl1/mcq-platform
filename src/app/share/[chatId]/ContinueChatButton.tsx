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

  return (
    <div className="flex gap-4">
      <button
        onClick={handleContinue}
        disabled={!!loading}
        className="px-6 py-3 rounded-full bg-[#282a2c] hover:bg-white/10 disabled:opacity-70 border border-white/10 text-white text-sm font-medium transition flex items-center justify-center min-w-[200px]"
      >
        {loading === 'duplicate' ? "Preparing..." : "Duplicate to my account"}
      </button>
      <button
        onClick={handleCollab}
        disabled={!!loading}
        className="px-6 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 disabled:opacity-70 text-white text-sm font-medium transition shadow-[0_4px_14px_0_rgba(11,87,208,0.39)] hover:shadow-[0_6px_20px_rgba(11,87,208,0.23)] hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center justify-center min-w-[200px]"
      >
        {loading === 'collab' ? "Joining..." : "Collab this chat"}
      </button>
    </div>
  );
}
