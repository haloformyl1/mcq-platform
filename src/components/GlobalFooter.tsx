"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageSquare, LogOut, Globe } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const NAVIGATION_GROUPS: FooterSection[] = [
  {
    title: "Explore",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Available Tests", href: "/dashboard/category/available" },
      { label: "Exam Series", href: "/dashboard#tests" },
      { label: "My Tracker", href: "/dashboard#performance" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Study Materials", href: "/study-material" },
      { label: "Digital Archive", href: "/study-material" },
      { label: "3D Simulations", href: "/3d-animations" },
      { label: "3D Experiences", href: "/3d-animations" },
    ],
  },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "PIECHEM AI Tutor", href: "/dashboard/ai" },
  { label: "Account Profile", href: "/dashboard/account" },
];

const SUPPORT_INFO = {
  phone: "9830507435",
  phoneHref: "tel:9830507435",
  whatsappHref: "https://wa.me/919830507435?text=Hello%20PIE%20CHEM%20Support",
  tagline: "Need assistance with PIE CHEM?",
  note: "Available for platform assistance.",
};

export default function GlobalFooter() {
  const pathname = usePathname();
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
    <footer className="relative z-20 w-full bg-[#02070D] text-[#91A5B8] border-t border-[rgba(0,180,255,0.12)] mt-auto font-sans overflow-hidden">
      {/* Top Subtle Cyan Glow Accent Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none" />

      {/* Atmospheric Ambient Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0, 229, 255, 0.05) 0%, transparent 70%)",
        }}
      />

      {/* Extremely Subtle Scientific Orbital Geometry Background (~4% opacity) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.75" fill="#00e5ff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footerGrid)" />
          <ellipse cx="18%" cy="35%" rx="220" ry="70" fill="none" stroke="#00e5ff" strokeWidth="1" strokeDasharray="4 6" transform="rotate(-15 200 100)" />
          <ellipse cx="85%" cy="65%" rx="260" ry="85" fill="none" stroke="#00e5ff" strokeWidth="1" strokeDasharray="3 5" transform="rotate(12 800 150)" />
        </svg>
      </div>

      {/* Main Container - Aligns with the site's content container */}
      <div className="relative w-full px-4 sm:px-8 lg:px-12 2xl:px-16 pt-4 sm:pt-5 pb-3 sm:pb-3.5">
        
        {/* Main Grid: Brand (~30%), Explore (~18%), Learn (~18%), Support (~34%) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          
          {/* Brand Column (Left Anchor) */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col items-start">
            <PiechemLogo size="md" href="/dashboard" isGoldMember={false}  />
            <p className="mt-2 text-xs sm:text-[12.5px] text-[#91A5B8] leading-normal max-w-xs sm:max-w-sm">
              Interactive learning for the sciences.
            </p>
          </div>

          {/* Navigation Group 1: EXPLORE */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest text-[#F3F7FA] uppercase mb-2 sm:mb-2.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              {NAVIGATION_GROUPS[0].title}
            </h3>
            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-[12.5px]">
              {NAVIGATION_GROUPS[0].links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#91A5B8] hover:text-cyan-300 transition-all duration-150 inline-block hover:translate-x-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Group 2: LEARN */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest text-[#F3F7FA] uppercase mb-2 sm:mb-2.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              {NAVIGATION_GROUPS[1].title}
            </h3>
            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-[12.5px]">
              {NAVIGATION_GROUPS[1].links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#91A5B8] hover:text-cyan-300 transition-all duration-150 inline-block hover:translate-x-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Group 3: SUPPORT (Links + Single Dedicated Support Card) */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest text-[#F3F7FA] uppercase mb-2 sm:mb-2.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              Support
            </h3>

            {/* Quick Support Links */}
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-[12px] mb-2">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#91A5B8] hover:text-cyan-300 transition-all duration-150 inline-block hover:translate-x-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Single Source of Contact / Support Block */}
            <div className="p-2.5 sm:p-3 rounded-lg bg-[#06111A]/80 border border-[rgba(0,180,255,0.14)] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              <div className="text-[11px] text-[#91A5B8] font-medium">
                {SUPPORT_INFO.tagline}
              </div>

              <div className="mt-1 flex items-baseline justify-between gap-2">
                <a
                  href={SUPPORT_INFO.phoneHref}
                  className="text-sm sm:text-base font-semibold tracking-wide text-white hover:text-cyan-300 transition-colors"
                  title="Call platform helpline"
                >
                  {SUPPORT_INFO.phone}
                </a>
                <span className="text-[9px] sm:text-[10px] text-cyan-400/80 font-mono tracking-wider uppercase">
                  Platform Helpline
                </span>
              </div>

              <p className="mt-1 text-[11px] text-[#607487] leading-tight">
                {SUPPORT_INFO.note}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={SUPPORT_INFO.phoneHref}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 hover:border-cyan-500/50 text-cyan-300 text-[11px] font-medium transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Support</span>
                </a>

                <a
                  href={SUPPORT_INFO.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#071927]/70 hover:bg-[#0c263c] border border-slate-700/70 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200 text-[11px] font-medium transition-colors"
                  title="Chat with Support on WhatsApp"
                >
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Subtle Horizontal Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[rgba(0,180,255,0.12)] to-transparent my-3 sm:my-3.5" />

        {/* Bottom Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-xs text-[#607487]">
          
          {/* Left: Copyright */}
          <div className="text-[11px] sm:text-xs text-[#607487] text-center sm:text-left">
            © 2026 PIE CHEM Platform. All rights reserved.
          </div>

          {/* Right: Security, Language & Discreet Logout */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-[11px]">
            
            {/* Trust Indicator */}
            <div className="inline-flex items-center gap-1.5 text-slate-400 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
              <span>Secure learning portal</span>
            </div>

            {/* Compact Secondary Language Selector */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-800 bg-[#06111A]/60 text-[11px] text-slate-300 hover:border-slate-700 select-none cursor-default">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>English</span>
              <span className="text-[9px] text-slate-500 ml-0.5">▼</span>
            </div>

            {/* Discreet Secondary Sign Out */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                title="Sign out and end session"
              >
                <LogOut className="w-3 h-3" />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            )}

          </div>

        </div>

      </div>
    </footer>
  );
}
