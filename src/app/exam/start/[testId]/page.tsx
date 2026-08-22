"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";

export default function ExamInstructions({ params }: { params: Promise<{ testId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [requiresSub, setRequiresSub] = useState(false);

  const startTest = async () => {
    setLoading(true);
    setError("");
    setRequiresSub(false);

    try {
      // Trigger browser fullscreen synchronously inside user gesture click
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => console.warn("Fullscreen deferred/denied"));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }

      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: resolvedParams.testId }),
      });
      const data = await res.json();
      if (res.ok) {
        // We'll store the exam data locally for the active session 
        // to avoid re-fetching or exposing correct answers.
        localStorage.setItem(`exam_${data.attemptId}`, JSON.stringify(data));
        router.push(`/exam/${data.attemptId}`);
      } else {
        setError(data.error || "Failed to start test");
        if (data.requiresSubscription) {
          setRequiresSub(true);
        }
        setLoading(false);
      }
    } catch (e) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-white font-sans">
      <AdminPreviewBanner />
      <div className="max-w-2xl w-full bg-[#161616]/80 rounded-lg p-8 border border-[#404040] mt-6">
        <h1 className="text-3xl font-bold mb-6 text-white tracking-wide">Test Instructions</h1>
        
        <div className="prose mb-8">
          <ul className="list-disc pl-5 space-y-2 text-[#a6a6a6]">
            <li>Ensure you have a stable internet connection before starting.</li>
            <li>The timer will start immediately after you click "Start Test".</li>
            <li>You must not switch browser tabs, minimize the window, or open other applications during the test.</li>
            <li><strong className="text-red-400">WARNING:</strong> Navigating away from the test tab will result in automatic submission.</li>
            <li><strong className="text-red-400">WARNING:</strong> Being inactive for more than 4 minutes will result in automatic submission.</li>
            <li>Your answers are saved automatically when selected.</li>
            <li>Once submitted, you cannot re-attempt the test.</li>
            <li>If you face any issues during the exam contact us on WhatsApp: <strong className="text-white">7595825568</strong> via another device (not the device you are using to attempt the test).</li>
          </ul>
        </div>

        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-950/90 via-red-950/90 to-amber-950/90 border border-amber-500/60 rounded-xl space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <div className="text-amber-200 text-sm font-semibold leading-relaxed flex items-start gap-2">
              <span className="text-amber-400 font-bold text-lg">⚠️</span>
              <span>{error}</span>
            </div>
            {requiresSub && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => router.push("/dashboard/account")}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.5)] transition active:scale-95 cursor-pointer"
                >
                  ✨ Upgrade to Paid Subscription
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#404040]">
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm font-medium text-[#a6a6a6] bg-[#262626] hover:bg-[#333333] hover:text-white transition rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={startTest}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-[#0099ff] hover:bg-[#007acc] transition rounded-md shadow-sm disabled:opacity-50"
          >
            {loading ? "Starting..." : "I Understand, Start Test"}
          </button>
        </div>
      </div>
    </div>
  );
}
