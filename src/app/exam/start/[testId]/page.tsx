"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";

export default function ExamInstructions({ params }: { params: Promise<{ testId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startTest = async () => {
    setLoading(true);
    setError("");

    try {
      // Pre-request camera & microphone permissions to avoid popups stealing focus during the actual exam
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Stop temporary tracks after granted so the exam page opens fresh devices
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Camera/Microphone permission denied", err);
      setError("Both Camera & Microphone access are required to take this exam. Please allow permissions when prompted by your browser.");
      setLoading(false);
      return;
    }

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
            <li><strong className="text-red-400">WARNING:</strong> Do not remove your eyes from the mobile/laptop screen for more than 10 seconds continuously — this is against PIECHEM exam rules. After 5 such warnings, the test may be automatically submitted.</li>
            <li>Your answers are saved automatically when selected.</li>
            <li>Once submitted, you cannot re-attempt the test.</li>
            <li>If you face any issues during the exam contact us on WhatsApp: <strong className="text-white">7595825568</strong> via another device (not the device you are using to attempt the test).</li>
          </ul>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/50 rounded-md">{error}</div>}

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
