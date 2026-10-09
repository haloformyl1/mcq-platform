"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContinueChatButton({ originalConversationId }: { originalConversationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    setLoading(true);
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
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleContinue}
      disabled={loading}
      className="px-8 py-3 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 disabled:opacity-70 text-white text-sm font-medium transition shadow-[0_4px_14px_0_rgba(11,87,208,0.39)] hover:shadow-[0_6px_20px_rgba(11,87,208,0.23)] hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center gap-2"
    >
      {loading ? "Preparing..." : "Continue this chat"}
    </button>
  );
}
