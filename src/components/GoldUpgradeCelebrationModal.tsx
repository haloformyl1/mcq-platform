"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Sparkles, ShieldCheck, Zap, BarChart3, Headphones } from "lucide-react";

interface StudentProps {
  id: string;
  name?: string | null;
  email?: string | null;
  subscriptionStatus?: string | null;
  subscriptionExpiresAt?: string | Date | null;
  subscriptionStartedAt?: string | Date | null;
}

interface CelebrationModalProps {
  student?: StudentProps | null;
}

export default function GoldUpgradeCelebrationModal({ student }: CelebrationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(true);
  
  const status = (student?.subscriptionStatus || "").trim().toUpperCase();
  const isGold = status === "PAID" || status === "COMPLIMENTARY";

  // Calculate remaining days
  const now = new Date();
  const expiryDate = student?.subscriptionExpiresAt ? new Date(student.subscriptionExpiresAt) : null;
  const diffMs = expiryDate ? Math.max(0, expiryDate.getTime() - now.getTime()) : 0;
  const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  useEffect(() => {
    if (!isGold || !student) {
      setIsClaiming(false);
      return;
    }

    let mounted = true;

    const claimReveal = async () => {
      try {
        const res = await fetch("/api/student/claim-reveal", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        
        if (!mounted) return;
        
        if (res.ok) {
          const data = await res.json();
          if (data.showReveal) {
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error("Failed to claim reveal:", error);
      } finally {
        if (mounted) {
          setIsClaiming(false);
        }
      }
    };

    // Small delay to ensure hydration is complete and avoid flashes
    const timer = setTimeout(() => {
      claimReveal();
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [isGold, student]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleStartPracticing = () => {
    handleClose();
    if (typeof window !== "undefined") {
      const testsSection = document.getElementById("tests");
      if (testsSection) {
        testsSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/dashboard#tests";
      }
    }
  };

  if (!isOpen || !isGold || isClaiming) return null;

  const validUntilStr = student?.subscriptionExpiresAt
    ? new Date(student.subscriptionExpiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toUpperCase()
    : "30 DAYS FROM APPROVAL";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#02050A]/95 backdrop-blur-md animate-in fade-in duration-700">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="gold-upgrade-title"
        aria-describedby="gold-upgrade-desc"
        className="relative w-full max-w-[26rem] sm:max-w-[28rem] rounded-2xl bg-gradient-to-b from-[#0a1120] to-[#040810] border border-[#262010] shadow-[0_20px_60px_-15px_rgba(234,179,8,0.15)] overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out"
      >
        {/* Subtle Ambient Gold Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close membership reveal"
          className="absolute top-4 right-4 z-50 p-2 text-slate-500 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 flex flex-col items-center text-center">
          
          {/* Premium Gold Emblem */}
          <div className="relative mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/30 to-yellow-300/30 rounded-xl rotate-45 blur-md" />
            <div className="relative w-full h-full bg-gradient-to-b from-[#1c1404] to-[#0a0701] border border-amber-500/40 rounded-xl rotate-45 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <div className="absolute inset-[2px] border border-amber-300/10 rounded-lg" />
              <div className="-rotate-45 text-amber-400">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/20 text-amber-400/90 text-[10px] font-bold tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Membership Activated
          </div>

          <h2 id="gold-upgrade-title" className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-amber-100 to-amber-600 mb-3 tracking-tight">
            PIECHEM Gold
          </h2>

          <p id="gold-upgrade-desc" className="text-sm sm:text-base text-slate-400 font-medium max-w-[18rem] sm:max-w-xs mx-auto mb-8 leading-relaxed">
            Your membership has been successfully verified and activated.
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mb-8" />

          {/* Pass Details */}
          <div className="w-full bg-[#0d1524] rounded-xl border border-slate-800/50 p-4 mb-6">
            <div className="text-[10px] sm:text-xs text-amber-500/80 font-bold tracking-widest uppercase mb-1">
              {totalDays}-Day All-Access Pass
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-slate-400 text-xs font-medium">VALID UNTIL</span>
              <span className="text-white text-sm sm:text-base font-bold tracking-wide">{validUntilStr}</span>
            </div>
          </div>

          {/* Benefits List */}
          <div className="w-full text-left space-y-3 mb-8">
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase text-center mb-4">Your Gold Benefits</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Unlimited Tests</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Rank Analytics</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">3D Chemistry</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Direct Support</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStartPracticing}
            className="w-full group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 px-6 py-3.5 text-sm sm:text-base font-bold text-black transition-all hover:from-amber-300 hover:to-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#0a1120]"
          >
            Enter PIECHEM Gold
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
