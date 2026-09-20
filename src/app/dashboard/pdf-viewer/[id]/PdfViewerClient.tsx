"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PiechemLogo from "@/components/PiechemLogo";
import { Shield, FileText, Lock, Sparkles } from "lucide-react";

interface PdfViewerClientProps {
  material: {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    discipline?: string | null;
    isPremium: boolean;
    fileSize?: string | null;
  };
  student?: {
    id: string;
    email: string;
    name?: string | null;
    subscriptionStatus: string;
  };
}

export default function PdfViewerClient({ material, student }: PdfViewerClientProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Live session concurrency polling
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const res = await fetch("/api/student/session/heartbeat");
        if (res.status === 401 && isMounted) {
          window.location.replace("/login?reason=concurrent_device");
        }
      } catch {}
    };
    const interval = setInterval(checkSession, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[#060c14] text-slate-100 select-none overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. SECURE TOP NAVIGATION BAR */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#081320]/95 border-b border-cyan-500/20 backdrop-blur-md flex items-center justify-between gap-3 z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center pr-1 sm:pr-2 border-r border-slate-800/80">
            <PiechemLogo 
              size="sm" 
              href="/dashboard" 
              isGoldMember={student?.subscriptionStatus === "PAID" || student?.subscriptionStatus === "COMPLIMENTARY"}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 uppercase font-black shrink-0">
                {material.category || "Study Material"}
              </span>
              {material.isPremium && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 uppercase font-bold shrink-0">
                  Gold Premium
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md md:max-w-xl">
              {material.title}
            </h1>
          </div>
        </div>

        {/* Security & Student ID Tag */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[10px] font-mono text-cyan-400/90 flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>DRM Protected Copy</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
              {student?.email || "Authenticated Student"}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Piechem Secure Reader</span>
          </div>
        </div>
      </header>

      {/* 2. PROTECTED PDF VIEWER CONTAINER */}
      <main className="flex-1 relative w-full h-full bg-[#181818] overflow-hidden">
        {/* Anti-Piracy Watermark Overlay (Transparent) */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-8 opacity-[0.035] overflow-hidden"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="text-center text-xs sm:text-sm font-mono tracking-widest text-white -rotate-12 select-none"
            >
              PIECHEM PROTECTED • {student?.email} • UNAUTHORIZED SHARING PROHIBITED
            </div>
          ))}
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070e17] gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-cyan-300 animate-pulse">Loading decrypted document stream...</p>
          </div>
        )}

        {/* Embedded Streaming Frame */}
        <iframe
          src={`/api/student/pdf-proxy/${material.id}#toolbar=0&navpanes=0`}
          className="w-full h-full border-0 relative z-0"
          title={material.title}
          onLoad={() => setIsLoading(false)}
        />
      </main>
    </div>
  );
}
