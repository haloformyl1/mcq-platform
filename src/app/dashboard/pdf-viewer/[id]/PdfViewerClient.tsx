"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PiechemLogo from "@/components/PiechemLogo";
import { 
  Shield, FileText, Lock, Sparkles, ZoomIn, ZoomOut, 
  RotateCcw, Download, Maximize2, Minimize2 
} from "lucide-react";

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
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 15, 200));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 15, 60));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard zoom controls (+, -, 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        zoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

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

  const downloadUrl = `/api/student/pdf-proxy/${material.id}?download=true`;
  const safeFilename = (material.title || "document").replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf";

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[#030a14] text-slate-100 select-none overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. TOP NAVIGATION & INTERACTIVE TOOLBAR */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#040e1b]/95 border-b border-cyan-500/20 backdrop-blur-xl flex items-center justify-between gap-2 sm:gap-4 z-30 shrink-0 shadow-lg shadow-black/40">
        {/* Left: Logo & Material Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="shrink-0 flex items-center pr-1.5 sm:pr-2.5 border-r border-slate-800/80">
            <PiechemLogo 
              size="sm" 
              href="/dashboard" 
              isGoldMember={student?.subscriptionStatus === "PAID" || student?.subscriptionStatus === "COMPLIMENTARY"}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 uppercase font-black shrink-0 tracking-wider">
                {material.category || "Study Material"}
              </span>
              {material.isPremium && (
                <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/40 uppercase font-bold shrink-0">
                  Gold Premium
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md lg:max-w-lg">
              {material.title}
            </h1>
          </div>
        </div>

        {/* Center: Interactive Controls (Zoom & Download) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Pill */}
          <div className="flex items-center bg-[#071626] border border-cyan-500/30 rounded-xl p-0.5 sm:p-1 shadow-inner">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoom <= 60}
              className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 transition disabled:opacity-30 cursor-pointer"
              title="Zoom Out (Ctrl -)"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="px-2 py-0.5 text-[11px] sm:text-xs font-mono font-bold text-cyan-300 hover:text-white transition cursor-pointer"
              title="Click to reset zoom (100%)"
            >
              {zoom}%
            </button>

            <button
              type="button"
              onClick={zoomIn}
              disabled={zoom >= 200}
              className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/60 transition disabled:opacity-30 cursor-pointer"
              title="Zoom In (Ctrl +)"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={resetZoom}
            className="hidden lg:inline-flex p-2 rounded-xl bg-[#071626] hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex p-2 rounded-xl bg-[#071626] hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Download Button */}
          <a
            href={downloadUrl}
            download={safeFilename}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
            title="Download PDF document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </a>
        </div>

        {/* Right: Security & Student Info */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] font-mono text-cyan-400/90 flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>DRM Protected Copy</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
              {student?.email || "Authenticated Student"}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Secure Reader</span>
          </div>
        </div>
      </header>

      {/* 2. BEAUTIFIED BLACKISH-BLUE CANVAS */}
      <main className="flex-1 relative w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-gradient-to-b from-[#05111f] via-[#020710] to-[#010306] overflow-auto p-2 sm:p-4 md:p-6 flex justify-center items-start">
        {/* Subtle Ambient Radial Glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-cyan-500/10 blur-[120px] pointer-events-none z-0" 
          aria-hidden="true" 
        />

        {/* Anti-Piracy Watermark Overlay */}
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
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#020710]/90 backdrop-blur-sm gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-cyan-300 animate-pulse tracking-wide">Loading decrypted document stream...</p>
          </div>
        )}

        {/* Scalable Document Frame with Blackish-Blue Elevated Container */}
        <div 
          style={{ 
            width: `${Math.min(100, Math.max(70, zoom))}%`,
            maxWidth: zoom > 100 ? `${zoom * 11}px` : "1100px",
            minHeight: "88vh",
            height: "100%",
            transition: "width 0.2s ease-out, max-width 0.2s ease-out"
          }}
          className="relative z-10 rounded-2xl border border-cyan-500/30 bg-[#091522] shadow-[0_0_60px_rgba(0,195,255,0.08),0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
        >
          <iframe
            key={zoom}
            src={`/api/student/pdf-proxy/${material.id}#toolbar=0&navpanes=0&zoom=${zoom}`}
            className="w-full flex-1 border-0 bg-transparent min-h-full"
            title={material.title}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </main>
    </div>
  );
}
