"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Atom, BookOpen, CheckCircle2, Mail, Phone } from "lucide-react";
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

  // Lock body scroll while the intro screen is active to prevent double scrollbars
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 1. Type "Hello," letter by letter (H -> e -> l -> l -> o -> ,)
  useEffect(() => {
    if (helloIndex < helloTarget.length) {
      const timer = setTimeout(() => {
        setHelloIndex(prev => prev + 1);
      }, 110);
      return () => clearTimeout(timer);
    } else {
      const pauseTimer = setTimeout(() => {
        setHelloFinished(true);
      }, 300);
      return () => clearTimeout(pauseTimer);
    }
  }, [helloIndex]);

  // 2. Type Description letter by letter after "Hello," completes
  useEffect(() => {
    if (!helloFinished) return;

    if (descIndex < descTarget.length) {
      const char = descTarget[descIndex];
      const delay = char === "." || char === "\n" ? 40 : 16;
      const timer = setTimeout(() => {
        setDescIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setDescFinished(true);
    }
  }, [helloFinished, descIndex]);

  // Fast-forward on click anywhere before completion
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
    // Restore normal browser scrolling for the login page
    document.body.style.overflow = "";
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
      className={`fixed inset-0 z-50 bg-[#000000] text-white flex flex-col justify-between items-center px-6 py-6 sm:py-8 overflow-y-auto no-scrollbar selection:bg-cyan-500/30 selection:text-cyan-200 transition-all duration-700 ease-out ${
        isExiting
          ? "opacity-0 scale-[1.02] pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        cursor: descFinished ? "default" : "pointer",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Top Bar with Clean Fixed Piechem Logo */}
      <div className="w-full max-w-5xl flex items-center justify-between pt-1 sm:pt-2">
        <div className="flex items-center">
          <PiechemLogo size="md" />
        </div>
        <div />
      </div>

      {/* Main Center Container */}
      <div className="w-full max-w-3xl my-auto py-4 sm:py-8 space-y-5 sm:space-y-6 text-center">
        
        {/* "Hello," + "A initiative by Arghyadeep Roy" */}
        <div className="space-y-2">
          <div className="min-h-[48px] sm:min-h-[64px] flex items-center justify-center">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight font-mono inline-flex items-center">
              <span>{currentHello}</span>
              {(!helloFinished || !descFinished) && (
                <span className="inline-block w-1 sm:w-1.5 h-8 sm:h-12 bg-cyan-400 ml-1.5 animate-pulse rounded-sm" />
              )}
            </h1>
          </div>

          {/* Subtitle directly after Hello: A initiative by Arghyadeep Roy */}
          <div className={`transition-all duration-500 ${helloFinished ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
            <p className="text-xs sm:text-sm md:text-base font-semibold tracking-wider text-cyan-300/90 uppercase font-mono">
              A initiative by <span className="text-white font-black underline decoration-cyan-500/50 underline-offset-4">Arghyadeep Roy</span>
            </p>
          </div>
        </div>

        {/* Dynamic Description Area */}
        <div className="min-h-[130px] sm:min-h-[150px] flex flex-col items-center justify-center space-y-3.5">
          {helloFinished && !descFinished ? (
            /* While typing */
            <p className="text-base sm:text-xl md:text-2xl text-gray-300 font-light leading-relaxed whitespace-pre-line font-mono">
              {currentDesc}
              <span className="inline-block w-1 sm:w-1.5 h-4 sm:h-6 bg-cyan-400/80 ml-1 animate-pulse align-middle" />
            </p>
          ) : descFinished ? (
            /* Finished rich display with glowing badges and colored accents */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <p className="text-lg sm:text-2xl md:text-3xl text-gray-200 font-light leading-relaxed max-w-2xl mx-auto">
                Whether preparing for{" "}
                <span className="text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">JEE</span>,{" "}
                <span className="text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">NEET</span>, or{" "}
                <span className="text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">Boards</span> — we have your back.
              </p>

              <p className="text-xs sm:text-sm md:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
                Explore interactive 3D chemistry visualizations, comprehensive chapter notes, curated DPPs, and real-time NTA mock tests powered by AI.
              </p>

              <div className="pt-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  Let&apos;s study together.
                </span>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
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

        {/* Continue Button & Contact Us Section */}
        <div className={`space-y-4 transition-all duration-500 ${descFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}>
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleContinue();
              }}
              className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-sm sm:text-base uppercase tracking-wider transition-all duration-300 shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:shadow-[0_0_55px_rgba(6,182,212,0.7)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <p className="text-[11px] text-gray-500 mt-1.5 font-mono">
              Click to enter the learning portal
            </p>
          </div>

          {/* Contact Details Bar */}
          <div className="pt-2.5 border-t border-[#1a1a1a] max-w-xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-400 font-sans">
            <span className="text-gray-400">Contact us at</span>
            <a
              href="mailto:mailarghyadeeproy@gmail.com"
              onClick={(e) => e.stopPropagation()}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 flex items-center gap-1.5 transition"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>mailarghyadeeproy@gmail.com</span>
            </a>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <span className="text-gray-400">or call us</span>
            <a
              href="tel:9830507435"
              onClick={(e) => e.stopPropagation()}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>9830507435</span>
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Minimal Subtitle */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-600 font-mono gap-2 pt-1">
        <span>© {new Date().getFullYear()} PIECHEM • Chemistry Excellence</span>
        <span>Empowering JEE, NEET & Board Aspirants</span>
      </div>
    </div>
  );
}
