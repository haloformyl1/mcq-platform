"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers
} from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

export default function LandingIntroScreen() {
  const [visible, setVisible] = useState(true);
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
      }, 95);
      return () => clearTimeout(timer);
    } else {
      const pauseTimer = setTimeout(() => {
        setHelloFinished(true);
      }, 250);
      return () => clearTimeout(pauseTimer);
    }
  }, [helloIndex]);

  // 2. Type Description letter by letter after "Hello," completes
  useEffect(() => {
    if (!helloFinished) return;

    if (descIndex < descTarget.length) {
      const char = descTarget[descIndex];
      const delay = char === "." || char === "\n" ? 35 : 14;
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

  // Continue / Redirect to normal login
  const handleContinue = () => {
    setIsExiting(true);
    document.body.style.overflow = "";
    setTimeout(() => {
      setVisible(false);
    }, 650);
  };

  if (!visible) return null;

  const currentHello = helloTarget.slice(0, helloIndex);
  const currentDesc = descTarget.slice(0, descIndex);

  // Progress percentage for 7-second countdown
  const progressPercent = Math.max(0, Math.min(100, ((7 - countdown) / 7) * 100));

  return (
    <div
      onClick={handleFastForward}
      className={`fixed inset-0 z-50 bg-[#050811] text-white flex flex-col justify-between items-center px-4 sm:px-8 py-6 sm:py-8 overflow-y-auto no-scrollbar selection:bg-cyan-500/30 selection:text-cyan-200 transition-all duration-700 ease-out relative ${
        isExiting
          ? "opacity-0 scale-[1.03] blur-sm pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        cursor: descFinished ? "default" : "pointer",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Background Volumetric Ambient Lighting & Cyber Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top-center Cyan Aurora */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] sm:w-[900px] h-[450px] bg-gradient-to-b from-cyan-500/18 via-blue-600/10 to-transparent blur-[120px] rounded-full" />
        
        {/* Bottom-right Purple Atmosphere */}
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-600/12 blur-[140px] rounded-full" />
        
        {/* Bottom-left Emerald Atmosphere */}
        <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-teal-500/10 blur-[130px] rounded-full" />

        {/* Subtle Cyber Perspective Grid Lines */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Top Header Bar with Verified Badge */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between pt-1 sm:pt-2 border-b border-white/[0.06] pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <PiechemLogo size="md" />
        </div>
        
        {/* High-tech status pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-mono tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="hidden sm:inline">SMART PORTAL GATEWAY</span>
          <span className="sm:hidden">PORTAL</span>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="relative z-10 w-full max-w-3xl my-auto py-6 sm:py-10 space-y-6 sm:space-y-8 text-center">
        
        {/* Headline & Initiative Badge */}
        <div className="space-y-3">
          {/* Glowing Badge: AN INITIATIVE BY ARGHYADEEP ROY */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-900/60 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.18)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="uppercase font-mono text-[11px] sm:text-xs">
              AN INITIATIVE BY <strong className="text-white font-black tracking-wider">ARGHYADEEP ROY</strong>
            </span>
          </div>

          {/* Dynamic "Hello," with Typewriter */}
          <div className="min-h-[52px] sm:min-h-[70px] flex items-center justify-center pt-1">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight font-sans inline-flex items-center">
              <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {currentHello}
              </span>
              {(!helloFinished || !descFinished) && (
                <span className="inline-block w-1.5 sm:w-2 h-8 sm:h-12 bg-cyan-400 ml-2 animate-pulse rounded-sm shadow-[0_0_12px_#06b6d4]" />
              )}
            </h1>
          </div>
        </div>

        {/* Dynamic Description & High-Yield Value Proposition */}
        <div className="min-h-[140px] sm:min-h-[160px] flex flex-col items-center justify-center space-y-4">
          {helloFinished && !descFinished ? (
            /* While typing */
            <p className="text-base sm:text-xl md:text-2xl text-gray-300 font-light leading-relaxed whitespace-pre-line font-mono max-w-2xl mx-auto">
              {currentDesc}
              <span className="inline-block w-1.5 h-5 sm:h-6 bg-cyan-400/80 ml-1.5 animate-pulse align-middle shadow-[0_0_8px_#06b6d4]" />
            </p>
          ) : descFinished ? (
            /* Finished rich display with glowing badges and colored accents */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
              <p className="text-lg sm:text-2xl md:text-3xl text-gray-200 font-light leading-relaxed max-w-2xl mx-auto">
                Whether preparing for{" "}
                <span className="text-cyan-400 font-bold drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">JEE</span>,{" "}
                <span className="text-amber-400 font-bold drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">NEET</span>, or{" "}
                <span className="text-emerald-400 font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">Boards</span> — we have your back.
              </p>

              <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
                Explore interactive 3D chemistry visualizations, comprehensive chapter notes, curated DPPs, and real-time NTA mock tests powered by AI.
              </p>

              <div className="pt-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  Let&apos;s study together.
                </span>
              </div>

              {/* Bento Feature Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 max-w-2xl mx-auto">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-cyan-500/25 backdrop-blur-md flex flex-col items-center gap-1.5 shadow-sm hover:border-cyan-400/50 transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Atom className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200">3D Molecular Labs</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-amber-500/25 backdrop-blur-md flex flex-col items-center gap-1.5 shadow-sm hover:border-amber-400/50 transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200">Notes & DPPs</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/25 backdrop-blur-md flex flex-col items-center gap-1.5 shadow-sm hover:border-emerald-400/50 transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200">NTA Mock Tests</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-purple-500/25 backdrop-blur-md flex flex-col items-center gap-1.5 shadow-sm hover:border-purple-400/50 transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-200">AI Chem Tutor</span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-mono text-cyan-300/80 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 100% NCERT Mapped
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Real-time NTA Pattern
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" /> Spatial WebGL Engine
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* REPLACED CONTINUE BUTTON: Automated 7-to-0 Second Countdown Engine */}
        <div className={`space-y-4 transition-all duration-500 ${descFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}>
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.2)]">
            
            {/* Top row: Countdown message and seconds ticker */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 text-left">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-mono font-black text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <span>{countdown}</span>
                  <span className="absolute inset-0 rounded-full border border-cyan-400/60 animate-ping opacity-30" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    {countdown > 0 ? (
                      <>
                        Redirecting to login in{" "}
                        <span className="text-cyan-400 font-mono font-black text-sm sm:text-base">
                          {countdown}s
                        </span>
                        ...
                      </>
                    ) : (
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        Landing on login portal...
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {isPaused ? "Timer paused by user" : "Preparing your chemistry workspace"}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Enter Now & Pause/Resume */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused((p) => !p);
                  }}
                  title={isPaused ? "Resume countdown" : "Pause countdown"}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-gray-300 hover:text-white transition-all shadow-sm"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContinue();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span>Enter Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Glowing countdown progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden relative border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_#06b6d4]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Contact Details Bar with Glass Badges */}
          <div className="pt-2 border-t border-white/[0.08] max-w-xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-400 font-sans">
            <span className="text-gray-400">Direct Support:</span>
            <a
              href="mailto:mailarghyadeeproy@gmail.com"
              onClick={(e) => e.stopPropagation()}
              className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 flex items-center gap-1.5 transition"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>mailarghyadeeproy@gmail.com</span>
            </a>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <a
              href="tel:9830507435"
              onClick={(e) => e.stopPropagation()}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>+91 98305 07435</span>
            </a>
          </div>
        </div>

      </main>

      {/* Bottom Minimal Status Footer */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 font-mono gap-2 pt-2 border-t border-white/[0.04]">
        <span>© {new Date().getFullYear()} PIECHEM • Chemistry Excellence</span>
        <span className="text-gray-400">Empowering JEE, NEET & Board Aspirants</span>
      </footer>
    </div>
  );
}
