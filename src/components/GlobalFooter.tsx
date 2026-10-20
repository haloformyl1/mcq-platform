"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MessageSquare, Mail } from "lucide-react";
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
  phone: "9830507435 (Arghyadeep Roy)",
  phoneHref: "tel:9830507435",
  whatsappHref: "https://wa.me/917595825568?text=Hello%20PIE%20CHEM%20Support",
  email: "mailarghyadeeproy@gmail.com",
  emailHref: "mailto:mailarghyadeeproy@gmail.com",
  tagline: "Need assistance with PIE CHEM?",
  note: "Available for platform assistance.",
};

export default function GlobalFooter() {
  const pathname = usePathname();

  // Do not render footer during active fullscreen proctored exams or admin panel
  if (pathname?.startsWith("/exam/") && !pathname?.includes("/result")) {
    return null;
  }
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="relative z-20 w-full bg-[#0b131e] text-slate-400 border-t border-slate-800 mt-auto font-sans">

      {/* Main Container - Aligns with the site's content container */}
      <div className="relative w-full px-4 sm:px-8 lg:px-12 2xl:px-16 py-3 sm:py-3">
        
        {/* Main Grid: Brand & Support */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 md:gap-8">
          
          {/* Brand Column (Left Anchor) */}
          <div className="flex flex-col items-center md:items-start shrink-0">
            <PiechemLogo size="md" href="/dashboard" isGoldMember={false}  />
          </div>

          {/* Navigation Group 3: SUPPORT (Links + Single Dedicated Support Card) */}
          <div className="flex flex-col w-full max-w-sm md:max-w-md ml-auto">
            <div className="flex flex-col items-center md:items-end">

            {/* Single Source of Contact / Support Block */}
            <div className="p-3 sm:p-4 rounded-xl bg-[#111a27] border border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400 font-medium">
                {SUPPORT_INFO.tagline}
              </div>

              <div className="mt-1 flex items-baseline justify-between gap-2">
                  <a
                    href={SUPPORT_INFO.phoneHref}
                    className="text-sm sm:text-base font-semibold tracking-wide text-white hover:text-slate-300 transition-colors flex items-center gap-2"
                    title="Call platform helpline"
                  >
                    <Phone className="w-4 h-4 text-cyan-400" />
                    {SUPPORT_INFO.phone}
                  </a>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <a
                  href={SUPPORT_INFO.phoneHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors border border-slate-700"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Support</span>
                </a>

                <a
                  href={SUPPORT_INFO.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors border border-emerald-500/20"
                  title="Chat with Support on WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                
                <a
                  href={SUPPORT_INFO.emailHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors border border-slate-700"
                  title="Email Support"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>

      </div>
    </footer>
  );
}

