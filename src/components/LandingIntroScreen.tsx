"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  Sparkles, 
  Atom, 
  BookOpen, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Pause, 
  Play, 
  ShieldCheck,
  Zap,
  Layers
} from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

export default function LandingIntroScreen() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  // Typewriter states
  const [helloIndex, setHelloIndex] = useState(0);
  const [descIndex, setDescIndex] = useState(0);
  const [helloFinished, setHelloFinished] = useState(false);
  const [descFinished, setDescFinished] = useState(false);

  // Countdown & Redirect states (7 to 0 seconds)
  const [countdown, setCountdown] = useState(7);
  const [isPaused, setIsPaused] = useState(false);
  const redirectTriggeredRef = useRef(false);

  const helloTarget = "Hello,";
  const descTarget = 
    "Whether preparing for JEE, NEET, or Boards — we have your back.\n" +
    "Explore interactive 3D chemistry visualizations, comprehensive chapter notes, curated DPPs, and real-time NTA mock tests powered by AI.\n\n" +
    "Let's study together.";

  // Lock body scroll while the intro screen is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 1. Type "Hello," letter by letter
  useEffect(() => {
    if (helloIndex < helloTarget.length) {
      const timer = setTimeout(() => {
        setHelloIndex(prev => prev + 1);
      }, 75);
      return () => clearTimeout(timer);
    } else {
      const pauseTimer = setTimeout(() => {
        setHelloFinished(true);
      }, 180);
      return () => clearTimeout(pauseTimer);
    }
  }, [helloIndex]);

  // 2. Type Description letter by letter after "Hello," completes
  useEffect(() => {
    if (!helloFinished) return;

    if (descIndex < descTarget.length) {
      const char = descTarget[descIndex];
      const delay = char === "." || char === "\n" ? 25 : 10;
      const timer = setTimeout(() => {
        setDescIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDescFinished(true);
    }
  }, [helloFinished, descIndex]);

  // 3. Countdown timer: 7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0
  useEffect(() => {
    if (!descFinished || isPaused) return;

    if (countdown > 0) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (countdown === 0 && !redirectTriggeredRef.current) {
      redirectTriggeredRef.current = true;
      handleContinue();
    }
  }, [descFinished, countdown, isPaused]);

  // Fast-forward on click anywhere before completion
  const handleFastForward = () => {
    if (!descFinished) {
      setHelloIndex(helloTarget.length);
      setHelloFinished(true);
      setDescIndex(descTarget.length);
      setDescFinished(true);
    }
  };

  // Continue / Redirect to normal login page
  const handleContinue = () => {
    setIsExiting(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("visited_landing", "true");
    }
    document.body.style.overflow = "";
    setTimeout(() => {
      router.push("/login");
    }, 550);
  };

  const currentHello = helloTarget.slice(0, helloIndex);
  const currentDesc = descTarget.slice(0, descIndex);

  // Progress percentage for 7-second countdown
  const progressPercent = Math.max(0, Math.min(100, ((7 - countdown) / 7) * 100));

  return (
    <div
      onClick={handleFastForward}
      className={`fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between items-center px-4 sm:px-8 py-2.5 sm:py-3 overflow-hidden select-none selection:bg-cyan-500/30 selection:text-cyan-200 transition-all duration-700 ease-out ${
        isExiting
          ? "opacity-0 scale-[1.02] blur-sm pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        backgroundColor: "#000000",
        cursor: descFinished ? "default" : "pointer",
      }}
    >
      {/* Top Header Bar: Far Left Status Badge & Far Right Logo */}
      <header className="w-full flex items-center justify-between px-2 sm:px-4 pb-2 border-b border-white/[0.08] shrink-0">
        {/* Left Side: SMART LEARNING PLATFORM */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d0d0d] border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-mono tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>SMART LEARNING PLATFORM</span>
        </div>

        {/* Far Right Side: Piechem Logo */}
        <div className="flex items-center">
          <PiechemLogo size="md" subtitle="Learning Platform" />
        </div>
      </header>

      {/* Main Center Area: Compact, fits all without mouse scroll or hover */}
      <main className="w-full max-w-2xl my-auto py-1 space-y-2.5 sm:space-y-3.5 text-center shrink-0">
        
        {/* Initiative pill + Headline */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0a] border border-cyan-500/40 text-cyan-300 text-[11px] sm:text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="uppercase font-mono">
              AN INITIATIVE BY <strong className="text-white font-black tracking-wider">ARGHYADEEP ROY</strong>
            </span>
          </div>

          <div className="min-h-[40px] sm:min-h-[50px] flex items-center justify-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans inline-flex items-center">
              <span>{currentHello}</span>
              {(!helloFinished || !descFinished) && (
                <span className="inline-block w-1.5 h-6 sm:h-8 bg-cyan-400 ml-1.5 animate-pulse rounded-sm shadow-[0_0_12px_#06b6d4]" />
              )}
            </h1>
          </div>
        </div>

        {/* Description area */}
        <div className="min-h-[85px] sm:min-h-[105px] flex flex-col items-center justify-center space-y-2">
          {helloFinished && !descFinished ? (
            <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed whitespace-pre-line font-mono max-w-xl mx-auto">
              {currentDesc}
              <span className="inline-block w-1.5 h-4 bg-cyan-400/80 ml-1 animate-pulse align-middle" />
            </p>
          ) : descFinished ? (
            <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-300">
              <p className="text-base sm:text-xl md:text-2xl text-gray-200 font-light leading-snug max-w-xl mx-auto">
                Whether preparing for{" "}
                <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">JEE</span>,{" "}
                <span className="text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">NEET</span>, or{" "}
                <span className="text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">Boards</span> — we have your back.
              </p>

              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                Explore interactive 3D chemistry visualizations, comprehensive chapter notes, curated DPPs, and real-time NTA mock tests powered by AI.
              </p>

              <div>
                <span className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  Let&apos;s study together.
                </span>
              </div>

              {/* 4 Compact Cards - directly visible, no mouse hover needed */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 max-w-xl mx-auto">
                <div className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 flex items-center gap-2 shadow-sm">
                  <div className="w-6 h-6 rounded bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Atom className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200 text-left">3D Molecular Labs</span>
                </div>

                <div className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 flex items-center gap-2 shadow-sm">
                  <div className="w-6 h-6 rounded bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200 text-left">Notes & DPPs</span>
                </div>

                <div className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 flex items-center gap-2 shadow-sm">
                  <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200 text-left">NTA Mock Tests</span>
                </div>

                <div className="px-2.5 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 flex items-center gap-2 shadow-sm">
                  <div className="w-6 h-6 rounded bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200 text-left">AI Chem Tutor</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Compact Countdown Bar */}
        <div className={`transition-all duration-500 ${descFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
          <div className="max-w-md mx-auto p-2.5 rounded-xl bg-[#080808] border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.18)]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 text-left">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#111] border border-cyan-400/50 text-cyan-300 font-mono font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <span>{countdown}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-wide">
                    {countdown > 0 ? (
                      <>
                        Redirecting to login in{" "}
                        <span className="text-cyan-400 font-mono font-black">
                          {countdown}s
                        </span>
                        ...
                      </>
                    ) : (
                      <span className="text-cyan-300 font-bold">
                        Entering login portal...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused((p) => !p);
                  }}
                  title={isPaused ? "Resume countdown" : "Pause countdown"}
                  className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#202020] border border-white/10 text-gray-300 hover:text-white transition-all shadow-sm"
                >
                  {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContinue();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-[11px] tracking-wide transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                >
                  <span>Enter Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-[#181818] overflow-hidden relative border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 transition-all duration-1000 ease-linear shadow-[0_0_8px_#06b6d4]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      </main>

      {/* Compact Footer: Direct Support & Copyright */}
      <footer className="w-full flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 font-mono gap-1 px-2 sm:px-4 pt-1.5 border-t border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <span>Direct Support:</span>
          <a href="mailto:mailarghyadeeproy@gmail.com" className="text-cyan-400 hover:underline">
            mailarghyadeeproy@gmail.com
          </a>
          <span>•</span>
          <a href="tel:9830507435" className="text-emerald-400 hover:underline">
            +91 98305 07435
          </a>
        </div>
        <span>© {new Date().getFullYear()} PIECHEM • Chemistry Excellence</span>
      </footer>
    </div>
  );
}
