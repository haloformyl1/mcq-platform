"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AdminPreviewBanner from "@/components/AdminPreviewBanner";
import GlobalHeader from "@/components/GlobalHeader";
import {
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  ShieldAlert,
  Wifi,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Flame,
  Lock,
} from "lucide-react";

interface TestDetails {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  totalQuestions: number;
  marksPerQuestion: number;
  negativeMarking: boolean;
  negativeMarks: number;
  targetBoard?: string | null;
  targetAcademicLevel?: string | null;
  isPremium?: boolean;
}

export default function ExamInstructions({ params }: { params: Promise<{ testId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresSub, setRequiresSub] = useState(false);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [fetchingTest, setFetchingTest] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTest() {
      try {
        const res = await fetch(`/api/exam/start?testId=${resolvedParams.testId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.test) setTestDetails(data.test);
            if (data.student) setStudent(data.student);
          }
        }
      } catch (e) {
        console.warn("Could not pre-fetch test metadata:", e);
      } finally {
        if (isMounted) setFetchingTest(false);
      }
    }
    loadTest();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.testId]);

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
        // Store the exam data locally for active session
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

  const positiveMarks = testDetails?.marksPerQuestion ?? 1;
  const negativeMarks = testDetails?.negativeMarking ? (testDetails.negativeMarks ?? 0) : 0;
  const totalQuestions = testDetails?.totalQuestions ?? 0;
  const duration = testDetails?.durationMinutes ?? 0;
  const totalMarks = totalQuestions > 0 ? totalQuestions * positiveMarks : null;

  const isUltra = student?.subscriptionStatus === "ULTRA" || student?.subscriptionStatus === "COMPLIMENTARY" || student?.subscriptionStatus === "PAID";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <AdminPreviewBanner />

      {/* Top Navbar: Constant throughout the entire website */}
      <GlobalHeader
        student={student}
        isGoldMember={isUltra}
      />

      {/* Main Expansive Container - uses available screen real estate */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col justify-center">
        
        {/* Title & Test Meta Strip */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-sky-500/15 text-sky-400 border border-sky-500/30">
              CANDIDATE BRIEFING
            </span>
            {testDetails?.targetBoard && testDetails.targetBoard !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-violet-500/15 text-violet-300 border border-violet-500/30">
                {testDetails.targetBoard}
              </span>
            )}
            {testDetails?.targetAcademicLevel && testDetails.targetAcademicLevel !== "ALL" && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Class/Level {testDetails.targetAcademicLevel}
              </span>
            )}
            {testDetails?.isPremium && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> PIE ULTRA
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {testDetails?.title || "Test Instructions & Guidelines"}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1.5 max-w-3xl">
            Please review the test rules, marking scheme, and anti-cheating protocols carefully before beginning your proctored session.
          </p>
        </div>

        {/* 4 Overview Metric Cards across the screen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          {/* Card 1: Duration */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm hover:border-slate-700/80 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</p>
              <p className="text-lg sm:text-2xl font-bold text-white font-mono">
                {duration > 0 ? `${duration} mins` : "Timed Test"}
              </p>
            </div>
          </div>

          {/* Card 2: Total Questions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm hover:border-slate-700/80 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Questions</p>
              <p className="text-lg sm:text-2xl font-bold text-white font-mono">
                {totalQuestions > 0 ? `${totalQuestions} MCQs` : "Multi-Question"}
              </p>
            </div>
          </div>

          {/* Card 3: Marking Scheme */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm hover:border-slate-700/80 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Marking Scheme</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">+{positiveMarks}</span>
                <span className="text-xs text-slate-500">/</span>
                <span className="text-sm sm:text-base font-bold text-rose-400 font-mono">
                  {negativeMarks > 0 ? `-${negativeMarks}` : "0"}
                </span>
                <span className="text-[11px] text-slate-400 font-medium ml-1">per question</span>
              </div>
            </div>
          </div>

          {/* Card 4: Total Marks */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm hover:border-slate-700/80 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Score</p>
              <p className="text-lg sm:text-2xl font-bold text-white font-mono">
                {totalMarks ? `${totalMarks} Marks` : "Standard"}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Wide Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* LEFT COLUMN: Exam Rules & Operation (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">General Rules &amp; Navigation</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">Must Read</span>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Timer Starts Instantly:</strong> The countdown timer will start immediately once you click <span className="text-sky-300 font-semibold">"I Understand, Start Test"</span> and will run continuously until duration expires.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Auto-Saving Mechanism:</strong> Your answers are saved automatically each time you select an option. You can modify or clear an answer anytime using the <span className="text-slate-200 font-semibold">Clear</span> or <span className="text-slate-200 font-semibold">Save and Next</span> controls.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Question Palette Review:</strong> Use the right-hand question palette during the exam to quickly jump between questions, check unattempted items, or review questions marked for later.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Single Attempt Policy:</strong> Once you submit or when time expires, you cannot re-attempt this session. Ensure all questions are finalized before manual submission.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Network Connectivity:</strong> Ensure a stable internet connection. If a temporary network glitch occurs, the exam platform will automatically retry saving your answers in the background.
                </span>
              </div>
            </div>

            {/* Helpline Box */}
            <div className="mt-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Exam Emergency Support (WhatsApp)</p>
                  <p className="text-sm sm:text-base font-bold text-white tracking-wider font-mono">
                    +91 7595825568
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-right hidden sm:block max-w-[200px]">
                Contact using a second device only, without closing your exam screen.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Proctoring, Security & Warnings (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Proctoring Card */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Security &amp; Proctoring</h2>
                </div>
                <span className="text-xs font-semibold text-rose-400">Strict Enforcement</span>
              </div>

              {/* Warning Banner 1: Tab Switching */}
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-200">Anti-Tab Switch Protection</h3>
                  <p className="text-xs sm:text-sm text-rose-300/80 mt-1 leading-relaxed">
                    Switching browser tabs, minimizing the test window, or opening external applications is strictly prohibited. Navigating away triggers an immediate automatic submission.
                  </p>
                </div>
              </div>

              {/* Warning Banner 2: 4-Min Inactivity */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-200">4-Minute Inactivity Limit</h3>
                  <p className="text-xs sm:text-sm text-amber-300/80 mt-1 leading-relaxed">
                    Staying completely idle or inactive for more than 4 consecutive minutes will lead to automated test termination and submission of recorded responses.
                  </p>
                </div>
              </div>

              {/* Notice 3: Fullscreen Launch */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                <p className="text-xs text-slate-300">
                  Clicking <strong className="text-white">Start Test</strong> will launch full-screen kiosk mode for distraction-free examination.
                </p>
              </div>
            </div>

            {/* Error / Alert Display if any */}
            {error && (
              <div className="p-5 bg-gradient-to-r from-amber-950/90 via-red-950/90 to-amber-950/90 border border-amber-500/60 rounded-xl space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <div className="text-amber-200 text-sm font-semibold leading-relaxed flex items-start gap-2.5">
                  <span className="text-amber-400 font-bold text-lg leading-none">⚠️</span>
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
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/90 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <button 
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel &amp; Return to Dashboard
          </button>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden md:inline-block">
              By starting, you agree to comply with all exam and proctoring rules.
            </span>
            <button
              type="button"
              onClick={startTest}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base tracking-wide shadow-[0_0_25px_rgba(56,189,248,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Preparing Examination Session...</span>
                </>
              ) : (
                <>
                  <span>I Understand, Start Test</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

      </main>

      {/* Footer Info Strip */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 px-4 sm:px-8 py-3 text-center text-xs text-slate-500 shrink-0">
        PIECHEM Secure Online Examination Portal &bull; All sessions are digitally monitored
      </footer>
    </div>
  );
}

