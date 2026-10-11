"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles, ShieldCheck, Zap, BarChart3, Headphones, Crown, Flame } from "lucide-react";

interface StudentProps {
  id: string;
  name?: string | null;
  email?: string | null;
  subscriptionStatus?: string | null;
  isComplimentary?: boolean | null;
  subscriptionExpiresAt?: string | Date | null;
  subscriptionStartedAt?: string | Date | null;
}

interface CelebrationModalProps {
  student?: StudentProps | null;
  planName?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function GoldUpgradeCelebrationModal({ 
  student, 
  planName,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose 
}: CelebrationModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(true);
  
  const status = (student?.subscriptionStatus || "").trim().toUpperCase();
  const isComp = Boolean(student?.isComplimentary || status === "COMPLIMENTARY");
  const isPaid = status === "PAID";
  const hasAccess = isPaid || isComp;

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  // Determine if Ultra or Pro
  const isUltra = (planName || "").toLowerCase().includes("ultra") || (!planName && Boolean(student?.subscriptionExpiresAt && !isComp));

  // Calculate remaining days
  const now = new Date();
  const expiryDate = student?.subscriptionExpiresAt ? new Date(student.subscriptionExpiresAt) : null;
  const diffMs = expiryDate ? Math.max(0, expiryDate.getTime() - now.getTime()) : 0;
  const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Listen for global custom event to trigger celebration anytime
  useEffect(() => {
    const handleTrigger = () => {
      setInternalIsOpen(true);
      setIsClaiming(false);
    };

    window.addEventListener("piechem:show-celebration", handleTrigger);
    return () => {
      window.removeEventListener("piechem:show-celebration", handleTrigger);
    };
  }, []);

  useEffect(() => {
    if (!hasAccess || !student) {
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
            setInternalIsOpen(true);
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

    const timer = setTimeout(() => {
      claimReveal();
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [hasAccess, student]);

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
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

  if (!isOpen) return null;

  const validUntilStr = student?.subscriptionExpiresAt
    ? new Date(student.subscriptionExpiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toUpperCase()
    : isComp
    ? "INFINITE TIME (LIFETIME)"
    : "30 DAYS FROM APPROVAL";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#02050A]/95 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        aria-describedby="upgrade-desc"
        className={"relative w-full max-w-[26rem] sm:max-w-[28rem] rounded-2xl border overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out shadow-2xl " + (
          isUltra
            ? "bg-gradient-to-b from-[#180407] to-[#080203] border-red-600/60 shadow-[0_20px_70px_rgba(229,9,20,0.35)]"
            : "bg-gradient-to-b from-[#0a1428] to-[#040812] border-blue-500/50 shadow-[0_20px_70px_rgba(37,99,235,0.25)]"
        )}
      >
        {/* Ambient Top Glow */}
        <div className={"pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] " + (
          isUltra ? "bg-red-600/30" : "bg-blue-600/20"
        )} />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close celebration modal"
          className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 flex flex-col items-center text-center">
          
          {/* Emblem */}
          <div className="relative mb-6 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
            <div className={"absolute inset-0 rounded-2xl rotate-45 blur-md " + (
              isUltra ? "bg-red-600/60" : "bg-blue-500/50"
            )} />
            <div className={"relative w-full h-full rounded-2xl rotate-45 flex items-center justify-center shadow-lg border " + (
              isUltra 
                ? "bg-gradient-to-b from-[#2b0509] to-[#100204] border-red-500/70 shadow-red-950/50" 
                : "bg-gradient-to-b from-[#081838] to-[#030914] border-blue-500/70 shadow-blue-950/50"
            )}>
              <div className="-rotate-45">
                {isUltra ? (
                  <Crown className="w-8 h-8 sm:w-9 sm:h-9 text-red-100 fill-red-500/40 drop-shadow-[0_0_12px_rgba(229,9,20,0.8)]" />
                ) : (
                  <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-blue-200 fill-blue-500/40 drop-shadow-[0_0_12px_rgba(37,99,235,0.8)]" />
                )}
              </div>
            </div>
          </div>

          {/* Heading Pill */}
          <div className={"inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3 border " + (
            isUltra
              ? "bg-red-950/80 border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
              : "bg-blue-950/80 border-blue-500/40 text-blue-200 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          )}>
            <span className={"w-1.5 h-1.5 rounded-full animate-pulse " + (isUltra ? "bg-red-400" : "bg-blue-400")} />
            {isUltra ? "PIE Ultra Activated" : isComp ? "Complimentary Lifetime Active" : "Pro Membership Active"}
          </div>

          <h2 id="upgrade-title" className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            {isUltra ? "PIE Ultra All-Access" : "PIE Pro"}
          </h2>

          <p id="upgrade-desc" className="text-xs sm:text-sm text-slate-300 font-medium max-w-[20rem] sm:max-w-xs mx-auto mb-6 leading-relaxed">
            {isUltra 
              ? "Your 30-Day PIE Ultra pass is now active with unlimited AI Doubt Solver, PIE LAB 3D simulations & all exams." 
              : isComp 
              ? "You have full lifetime access to all Chemistry exams, 3D molecular models, and proctored ranking analytics." 
              : "Your PIE Pro membership is verified. Practice unlimited exams, 3D molecular models, and proctored tests."}
          </p>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          {/* Pass Details Box */}
          <div className="w-full bg-black/40 rounded-xl border border-white/10 p-4 mb-6">
            <div className={"text-[10px] sm:text-xs font-black tracking-widest uppercase mb-1 " + (isUltra ? "text-red-400" : "text-blue-400")}>
              {isComp ? "INFINITE DURATION" : `${totalDays}-Day Access Pass`}
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-slate-400 text-xs font-medium">VALID UNTIL</span>
              <span className="text-white text-xs sm:text-sm font-bold tracking-wide font-mono">{validUntilStr}</span>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="w-full text-left space-y-3 mb-6">
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase text-center mb-3">Included With Your Plan</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className={"w-4 h-4 shrink-0 " + (isUltra ? "text-red-400" : "text-blue-400")} />
                <span>Unlimited Tests</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className={"w-4 h-4 shrink-0 " + (isUltra ? "text-red-400" : "text-blue-400")} />
                <span>Rank Analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={"w-4 h-4 shrink-0 " + (isUltra ? "text-red-400" : "text-blue-400")} />
                <span>{isUltra ? "Unlimited PIE AI" : "20 AI queries/day"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className={"w-4 h-4 shrink-0 " + (isUltra ? "text-red-400" : "text-blue-400")} />
                <span>{isUltra ? "PIE LAB Unlimited" : "3D Models & Vault"}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartPracticing}
            className={"w-full group relative flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm sm:text-base font-black transition-all cursor-pointer shadow-lg hover:brightness-110 active:scale-98 " + (
              isUltra 
                ? "bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-red-950/50" 
                : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-950/50"
            )}
          >
            Start Practicing Now
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
