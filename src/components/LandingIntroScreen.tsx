"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Atom, BookOpen, CheckCircle2 } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

export default function LandingIntroScreen() {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Typewriter states
  const [helloIndex, setHelloIndex] = useState(0);
  const [descIndex, setDescIndex] = useState(0);
  const [helloFinished, setHelloFinished] = useState(false);
  const [descFinished, setDescFinished] = useState(false);

  const helloTarget = "Hello,";
  const descTarget = 
    "Whether preparing for JEE, NEET, or Boards — we have your back.\n" +
    "Explore interactive 3D chemistry visualizations, comprehensive chapter notes, curated DPPs, and real-time NTA mock tests powered by AI.\n\n" +
    "Let's study together.";

  // 1. Type "Hello," letter by letter (H -> e -> l -> l -> o -> ,)
  useEffect(() => {
    if (helloIndex < helloTarget.length) {
      const timer = setTimeout(() => {
        setHelloIndex(prev => prev + 1);
      }, 120);
      return () => clearTimeout(timer);
    } else {
      const pauseTimer = setTimeout(() => {
        setHelloFinished(true);
      }, 350);
      return () => clearTimeout(pauseTimer);
    }
  }, [helloIndex]);

  // 2. Type Description letter by letter after "Hello," completes
  useEffect(() => {
    if (!helloFinished) return;

    if (descIndex < descTarget.length) {
      const char = descTarget[descIndex];
      // Slightly longer pause on punctuation for natural typing rhythm
      const delay = char === "." || char === "\n" ? 45 : 18;
      const timer = setTimeout(() => {
        setDescIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDescFinished(true);
    }
  }, [helloFinished, descIndex]);

  // Quick skip typing on click anywhere
  const handleFastForward = () => {
    if (!descFinished) {
      setHelloIndex(helloTarget.length);
      setHelloFinished(true);
      setDescIndex(descTarget.length);
      setDescFinished(true);
    }
  };

  // Continue to normal login
  const handleContinue = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
    }, 600);
  };

  if (!visible) return null;

  const currentHello = helloTarget.slice(0, helloIndex);
  const currentDesc = descTarget.slice(0, descIndex);

  return (
    <div
      onClick={handleFastForward}
      className={`fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between items-center px-6 py-10 sm:py-16 overflow-y-auto selection:bg-cyan-500/30 selection:text-cyan-200 transition-all duration-700 ease-out ${
        isExiting
          ? "opacity-0 scale-[1.02] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{ cursor: descFinished ? "default" : "pointer" }}
    >
      {/* Top Bar with Minimal Piechem Logo & Skip Option */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition">
          <PiechemLogo className="w-8 h-8 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
          <span className="font-extrabold text-sm sm:text-base tracking-widest text-white font-mono">
            PIECHEM
          </span>
        </div>

        {!descFinished ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleFastForward();
            }}
            className="text-xs text-gray-500 hover:text-cyan-400 font-mono transition cursor-pointer"
          >
            Skip typing ⏭
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleContinue();
            }}
            className="text-xs text-gray-400 hover:text-white font-mono transition cursor-pointer flex items-center gap-1"
          >
            <span>Skip to Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Center Message Container */}
      <div className="w-full max-w-3xl my-auto py-8 sm:py-12 space-y-6 sm:space-y-8 text-center">
        
        {/* "Hello," typed letter-by-letter */}
        <div className="min-h-[50px] sm:min-h-[72px] flex items-center justify-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight font-mono inline-flex items-center">
            <span>{currentHello}</span>
            {(!helloFinished || !descFinished) && (
              <span className="inline-block w-1 sm:w-1.5 h-8 sm:h-12 bg-cyan-400 ml-1.5 animate-pulse rounded-sm" />
            )}
          </h1>
        </div>

        {/* Dynamic Description Area */}
        <div className="min-h-[140px] sm:min-h-[160px] flex flex-col items-center justify-center space-y-4">
          {helloFinished && !descFinished ? (
            /* While typing */
            <p className="text-base sm:text-xl md:text-2xl text-gray-300 font-light leading-relaxed whitespace-pre-line font-mono">
              {currentDesc}
              <span className="inline-block w-1 sm:w-1.5 h-4 sm:h-6 bg-cyan-400/80 ml-1 animate-pulse align-middle" />
            </p>
          ) : descFinished ? (
            /* Finished rich display with glowing badges and colored accents */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
              <p className="text-lg sm:text-2xl md:text-3xl text-gray-200 font-light leading-relaxed max-w-2xl mx-auto">
                Whether preparing for{" "}
                <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">JEE</span>,{" "}
                <span className="text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">NEET</span>, or{" "}
                <span className="text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">Boards</span> — we have your back.
              </p>

              <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
                Explore interactive 3D chemistry visualizations, comprehensive chapter notes, curated DPPs, and real-time NTA mock tests powered by AI.
              </p>

              <div className="pt-2">
                <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  Let&apos;s study together.
                </span>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                <span className="px-3 py-1 rounded-full bg-[#111] border border-cyan-500/30 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                  <Atom className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3D Molecular Labs</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-[#111] border border-[#333] text-gray-300 text-[11px] font-medium flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chapter Notes & DPPs</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-[#111] border border-[#333] text-gray-300 text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NTA Mock Tests</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-[#111] border border-[#333] text-gray-300 text-[11px] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Chemistry Tutor</span>
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Continue Button */}
        <div className={`pt-4 transition-all duration-500 ${descFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleContinue();
            }}
            className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-sm sm:text-base uppercase tracking-wider transition-all duration-300 shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:shadow-[0_0_55px_rgba(6,182,212,0.7)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <p className="text-[11px] text-gray-500 mt-2 font-mono">
            Click to enter the learning portal
          </p>
        </div>

      </div>

      {/* Bottom Minimal Footer */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 font-mono gap-2">
        <span>© {new Date().getFullYear()} PIECHEM • Chemistry Excellence</span>
        <span>Empowering JEE, NEET & Board Aspirants</span>
      </div>
    </div>
  );
}
