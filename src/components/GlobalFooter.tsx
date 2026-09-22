"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Phone, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

export default function GlobalFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login state dynamically for logout visibility
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasAuth = 
        document.cookie.includes("student_session") || 
        document.cookie.includes("session") ||
        localStorage.getItem("piechem_is_gold") !== null;
      setIsLoggedIn(hasAuth || pathname?.startsWith("/dashboard") || pathname?.startsWith("/3d-animations"));
    }
  }, [pathname]);

  // Do not render footer during active fullscreen proctored exams or admin panel
  if (pathname?.startsWith("/exam/") && !pathname?.includes("/result")) {
    return null;
  }
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("piechem_is_gold");
          localStorage.removeItem("piechem_gold_expires_at");
          localStorage.removeItem("piechem_is_complimentary");
          window.dispatchEvent(new Event("piechem_gold_status_changed"));
        } catch {}
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <footer className="relative w-full bg-black text-slate-300 overflow-hidden mt-16 sm:mt-24 border-t border-cyan-500/20">
      
      {/* 1. Subtle Scientific Chemistry Universe Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Soft atmospheric radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(0,195,255,0.06),transparent_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

        {/* Faint Scientific Orbital Curves */}
        <div className="absolute -left-20 -top-20 w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] border border-cyan-500/10 rounded-full blur-[0.5px]" />
        <div className="absolute -left-32 -top-32 w-[600px] sm:w-[780px] h-[600px] sm:h-[780px] border border-cyan-500/5 rounded-full" />
        <div className="absolute -right-16 bottom-0 w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] border border-indigo-500/10 rounded-full" />
      </div>

      {/* 2. Top Refined Light Divider Line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent relative z-10" />

      {/* 3. Main Footer Content Container - Aligned pixel-perfect with Global Header */}
      <div className="relative z-10 w-full px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-12 sm:pt-16 pb-28 sm:pb-16">
        
        {/* Primary Row: Brand Block + Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 sm:pb-14">
          
          {/* A. Brand Column (Left Side, 5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Same Logo Component as Global Header */}
            <div className="flex items-center gap-3">
              <PiechemLogo size="md" href="/dashboard" />
            </div>

            {/* Micro Badge */}
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-cyan-500/25 bg-cyan-950/40 text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Smart Learning Platform</span>
            </div>

            {/* Editorial Brand Statement */}
            <p className="text-xs sm:text-sm text-slate-400/90 leading-relaxed max-w-sm pt-1">
              Making complex chemistry easier to see, understand and remember through real-time WebGL molecular simulations and adaptive assessment.
            </p>

            {/* Helpline Quick Contact Pill */}
            <div className="pt-2">
              <a
                href="tel:9830507435"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-[#040e17]/80 hover:bg-cyan-950/50 hover:border-cyan-400 text-xs text-slate-300 hover:text-white transition-all duration-200 group shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] text-slate-400">Helpline:</span>
                <span className="font-mono font-bold text-cyan-300">9830507435</span>
                <span className="text-[10px] text-slate-500">(Arghyadeep Roy)</span>
              </a>
            </div>

          </div>

          {/* B. Navigation Columns (Right Side, 7 Cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6 pt-2 md:pt-0">
            
            {/* Column 1: PLATFORM */}
            <div className="space-y-3.5">
              <h4 className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                Platform
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link 
                    href="/dashboard" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Dashboard</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard#tests" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Available Tests</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/study-material" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Study Materials</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/3d-animations" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>3D Experiences</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard#performance" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>My Tracker</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: LEARNING */}
            <div className="space-y-3.5">
              <h4 className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                Learning
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link 
                    href="/study-material" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Digital Archive</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/3d-animations" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>3D Simulations</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/ai" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>PIECHEM AI Tutor</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard#tests" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Exam Series</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: SUPPORT & SYSTEM */}
            <div className="space-y-3.5 col-span-2 sm:col-span-1">
              <h4 className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                Support
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <a 
                    href="tel:9830507435" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Contact Helpline</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <Link 
                    href="/dashboard/account" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Account Profile</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/account" 
                    className="text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Gold Subscription</span>
                    <ChevronRight className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>SSL Secured Portal</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* 4. Bottom Utility Bar */}
        <div className="border-t border-cyan-500/15 pt-6 sm:pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          
          {/* Legal and Copyright */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
            <span className="font-semibold text-slate-400">© 2026 PIE CHEM Platform</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>All rights reserved</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400">
              Helpline:{" "}
              <a href="tel:9830507435" className="text-cyan-400 hover:underline font-mono">
                9830507435
              </a>
            </span>
          </div>

          {/* Refined Secondary Logout Action */}
          {isLoggedIn && (
            <div className="self-end sm:self-auto">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/45 border border-red-500/30 hover:border-red-500/60 text-red-300 hover:text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 cursor-pointer disabled:opacity-50"
                title="Log out and end session securely"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{isLoggingOut ? "Logging out..." : "Log out from PIECHEM"}</span>
              </button>
            </div>
          )}

        </div>

      </div>

    </footer>
  );
}
