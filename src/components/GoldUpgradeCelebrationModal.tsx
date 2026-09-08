"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const status = (student?.subscriptionStatus || "").trim().toUpperCase();
  const isGold = status === "PAID" || status === "COMPLIMENTARY";

  // Calculate remaining days & whether this is an extension (e.g. 2 days left + 30 days = 32 days)
  const now = new Date();
  const expiryDate = student?.subscriptionExpiresAt ? new Date(student.subscriptionExpiresAt) : null;
  const diffMs = expiryDate ? Math.max(0, expiryDate.getTime() - now.getTime()) : 0;
  const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  
  // If total days > 30, it indicates an additive extension on top of remaining days
  const isExtended = totalDays > 30;

  const getStorageKey = useCallback(() => {
    if (!student) return null;
    // Key is tied to the exact expiration timestamp. When extended (e.g. from 2 days to 32 days),
    // this timestamp changes, automatically generating a fresh key so the modal shows for the extension!
    const expiryKey = student.subscriptionExpiresAt 
      ? new Date(student.subscriptionExpiresAt).getTime() 
      : "active";
    const studentIdentifier = student.id || student.email || "student";
    return "piechem_gold_celebrated_" + studentIdentifier + "_" + expiryKey;
  }, [student]);

  const checkAndShow = useCallback((force = false) => {
    if (!isGold || !student) return;

    if (force) {
      setIsOpen(true);
      return;
    }

    const key = getStorageKey();
    if (!key) return;

    const hash = typeof window !== "undefined" ? window.location.hash.toLowerCase() : "";
    if (hash === "#celebrate") {
      setIsOpen(true);
      return;
    }

    try {
      const alreadyCelebrated = localStorage.getItem(key);
      if (!alreadyCelebrated) {
        setIsOpen(true);
      }
    } catch (e) {
      setIsOpen(true);
    }
  }, [isGold, student, getStorageKey]);

  useEffect(() => {
    if (!isGold || !student) return;

    // Small delay to ensure smooth entry after page mount
    const timer = setTimeout(() => {
      checkAndShow();
    }, 200);

    // Navigation triggers (browser back/forward, hash changes, tab focus, app navigation)
    const handlePopState = () => {
      checkAndShow();
    };

    const handleHashChange = () => {
      if (window.location.hash.toLowerCase() === "#celebrate") {
        checkAndShow(true);
      }
    };

    const handleCustomShow = () => {
      checkAndShow(true);
    };

    const handleFocus = () => {
      checkAndShow();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAndShow();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("piechem:show-celebration", handleCustomShow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("piechem:show-celebration", handleCustomShow);
    };
  }, [isGold, student, checkAndShow]);

  // Confetti Particle System
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#f59e0b", "#fbbf24", "#fef08a", "#38bdf8", "#10b981", "#ec4899", "#a855f7"];
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      type: "circle" | "rect" | "star";
    }> = [];

    for (let i = 0; i < 140; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 360,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 150,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 14,
        speedY: Math.random() * -15 - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        type: Math.random() > 0.6 ? "star" : Math.random() > 0.3 ? "rect" : "circle",
      });
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyAlive = false;

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.22;
        p.speedX *= 0.985;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.003;

        if (p.opacity > 0) {
          anyAlive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.type === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.type === "rect") {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
          } else {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              ctx.lineTo(
                Math.cos(((18 + i * 72) * Math.PI) / 180) * p.size,
                -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.size
              );
              ctx.lineTo(
                Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 2),
                -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 2)
              );
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (anyAlive) {
        animationId = requestAnimationFrame(render);
      }
    };

    animationId = requestAnimationFrame(render);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  const handleClose = () => {
    const key = getStorageKey();
    if (key) {
      try {
        localStorage.setItem(key, "true");
      } catch (e) {}
    }
    if (typeof window !== "undefined" && window.location.hash.toLowerCase() === "#celebrate") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setIsOpen(false);
  };

  const handleStartPracticing = () => {
    handleClose();
    if (typeof window !== "undefined") {
      const testsSection = document.getElementById("tests");
      if (testsSection) {
        testsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  if (!isOpen || !isGold) return null;

  const validUntilStr = student?.subscriptionExpiresAt
    ? new Date(student.subscriptionExpiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "30 Days from approval";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 w-full h-full"
      />

      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="gold-upgrade-title"
        className="relative z-20 w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0f1d32] via-[#091322] to-[#040812] border-2 border-amber-500/40 p-6 md:p-8 text-center shadow-[0_0_90px_rgba(245,158,11,0.35)] animate-in zoom-in-95 duration-300"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />

        <button
          onClick={handleClose}
          aria-label="Close celebration modal"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 3D Glowing Trophy Icon */}
        <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 blur-xl opacity-75 animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-[2px] shadow-2xl shadow-amber-500/50 flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-[#08121e] flex flex-col items-center justify-center">
              <span className="text-3xl filter drop-shadow">👑</span>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide uppercase mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {isExtended ? ("+30 Days Added • Total " + totalDays + " Days Active") : "Payment Verified & Approved"}
          </span>
        </div>

        <h2 id="gold-upgrade-title" className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
          {isExtended ? (
            <>
              Gold Pass <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Extended!</span>
            </>
          ) : (
            <>
              Welcome to <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">PIECHEM Gold!</span>
            </>
          )}
        </h2>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          {isExtended ? (
            <>
              Congratulations <strong className="text-white">{student?.name || "Student"}</strong>! Administrator <strong className="text-amber-300">Arghyadeep Roy</strong> has approved your transaction. <strong className="text-amber-300 font-bold">+30 Days</strong> have been added to your remaining validity, giving you <strong className="text-emerald-400 font-bold">{totalDays} days of total access</strong>!
            </>
          ) : (
            <>
              Congratulations <strong className="text-white">{student?.name || "Student"}</strong>! Administrator <strong className="text-amber-300">Arghyadeep Roy</strong> has approved your membership transaction. Your 30-Day All-Access Pass is now active.
            </>
          )}
        </p>

        {/* Validity Highlight Box */}
        <div className="bg-white/5 border border-amber-500/25 rounded-2xl p-3.5 mb-5 flex items-center justify-between text-left shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold shrink-0">
              ⭐
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                {isExtended ? "Updated Pass Validity" : "Pass Validity Period"}
              </div>
              <div className="text-xs sm:text-sm text-white font-bold">
                Valid until {validUntilStr}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                {totalDays} Days of Total Access Remaining
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            Active Now
          </span>
        </div>

        {/* Unlocked Benefits */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-left">
          <div className="bg-[#0b1728] border border-white/10 rounded-xl p-2.5">
            <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5 mb-1">
              <span>🔓</span> Unlimited Tests
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Access all 50+ premium chemistry test modules.
            </p>
          </div>

          <div className="bg-[#0b1728] border border-white/10 rounded-xl p-2.5">
            <div className="text-blue-400 font-bold text-xs flex items-center gap-1.5 mb-1">
              <span>🧪</span> 3D Models
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Step-by-step solutions with 3D molecular structures.
            </p>
          </div>

          <div className="bg-[#0b1728] border border-white/10 rounded-xl p-2.5">
            <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5 mb-1">
              <span>📊</span> Rank Analytics
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Proctored national percentiles & accuracy curves.
            </p>
          </div>

          <div className="bg-[#0b1728] border border-white/10 rounded-xl p-2.5">
            <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-1">
              <span>⚡</span> Direct Support
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Direct mentor helpline: 9830507435
            </p>
          </div>
        </div>

        <button
          onClick={handleStartPracticing}
          className="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm text-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          🚀 Start Practicing Tests Now
        </button>

        <p className="text-[11px] text-slate-500 mt-3">
          Need help with your subscription? Call or WhatsApp Administrator: <a href="tel:9830507435" className="text-amber-400 hover:underline font-bold">9830507435</a>
        </p>
      </div>
    </div>
  );
}
