"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
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
    <footer className="relative w-full bg-black text-slate-300 overflow-hidden mt-16 sm:mt-24 border-t border-cyan-500/20 font-sans">
      
      {/* 1. Subtle Scientific Chemistry Universe Backdrop (PRESERVED - UNTOUCHED) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Soft atmospheric radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(0,195,255,0.06),transparent_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

        {/* Faint Scientific Orbital Curves */}
        <div className="absolute -left-20 -top-20 w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] border border-cyan-500/10 rounded-full blur-[0.5px]" />
        <div className="absolute -left-32 -top-32 w-[600px] sm:w-[780px] h-[600px] sm:h-[780px] border border-cyan-500/5 rounded-full" />
        <div className="absolute -right-16 bottom-0 w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] border border-indigo-500/10 rounded-full" />
      </div>

      {/* 2. Top Refined Light Divider Line (PRESERVED) */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent relative z-10" />

      {/* 3. Netflix-Inspired Minimalist Content Layout */}
      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 max-w-6xl mx-auto pt-12 sm:pt-16 pb-20 sm:pb-24 text-slate-400">
        
        {/* Top Helpline / Contact Line */}
        <div className="mb-8 text-sm sm:text-base text-slate-400">
          Questions? Call{" "}
          <a href="tel:9830507435" className="underline hover:text-white transition-colors">
            9830507435
          </a>
          <span className="text-slate-500 text-xs sm:text-sm ml-1.5">(Arghyadeep Roy)</span>
        </div>

        {/* 4-Column Clean Grid of Navigation Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 sm:gap-x-12 gap-y-3.5 mb-8 text-xs sm:text-[13px]">
          
          {/* Column 1 */}
          <ul className="space-y-3">
            <li>
              <Link href="/dashboard" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard#tests" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Available Tests
              </Link>
            </li>
            <li>
              <Link href="/study-material" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Study Materials
              </Link>
            </li>
            <li>
              <Link href="/dashboard#performance" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                My Tracker
              </Link>
            </li>
          </ul>

          {/* Column 2 */}
          <ul className="space-y-3">
            <li>
              <Link href="/study-material" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Digital Archive
              </Link>
            </li>
            <li>
              <Link href="/3d-animations" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                3D Simulations
              </Link>
            </li>
            <li>
              <Link href="/3d-animations" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                3D Experiences
              </Link>
            </li>
            <li>
              <Link href="/dashboard#tests" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Exam Series
              </Link>
            </li>
          </ul>

          {/* Column 3 */}
          <ul className="space-y-3">
            <li>
              <Link href="/dashboard/ai" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                PIECHEM AI Tutor
              </Link>
            </li>
            <li>
              <Link href="/dashboard/account" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Account Profile
              </Link>
            </li>
            <li>
              <Link href="/dashboard/account" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Gold Subscription
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Smart Learning Platform
              </Link>
            </li>
          </ul>

          {/* Column 4 */}
          <ul className="space-y-3">
            <li>
              <a href="tel:9830507435" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Contact Helpline
              </a>
            </li>
            <li>
              <a href="tel:9830507435" className="text-slate-400 hover:text-white hover:underline transition-colors block">
                Helpline: 9830507435
              </a>
            </li>
            <li>
              <span className="text-slate-400 cursor-default inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>SSL Secured Portal</span>
              </span>
            </li>
          </ul>

        </div>

        {/* Netflix Language Selector Style Button & Logout */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded border border-slate-700 bg-[#0b0f14]/80 text-xs sm:text-[13px] text-slate-300 select-none">
            <span className="text-xs">文A</span>
            <span>English</span>
            <span className="text-[9px] text-slate-400 ml-1">▼</span>
          </div>

          {isLoggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-slate-700 hover:border-slate-500 bg-[#0b0f14]/80 hover:bg-slate-900 text-xs sm:text-[13px] text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Log out and end session securely"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{isLoggingOut ? "Logging out..." : "Log out from PIECHEM"}</span>
            </button>
          )}
        </div>

        {/* Brand / Country Line: Netflix India Equivalent */}
        <div className="flex items-center gap-2.5 mb-4 text-xs sm:text-[13px] text-slate-400">
          <PiechemLogo size="sm" showText={false} />
          <span className="font-normal">PIE CHEM India</span>
        </div>

        {/* Editorial Statement & Copyright */}
        <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-500 leading-relaxed max-w-2xl">
          <p>
            Making complex chemistry easier to see, understand and remember through real-time WebGL molecular simulations and adaptive assessment.
          </p>
          <p>
            © 2026 PIE CHEM Platform. All rights reserved.
          </p>
        </div>

      </div>

    </footer>
  );
}
