"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Atom, Maximize, Minimize, 
  ShieldCheck, RefreshCw 
} from "lucide-react";

interface LabViewerClientProps {
  material: {
    id: string;
    title: string;
    description?: string | null;
    isPremium: boolean;
    token?: string;
  };
  student: {
    id: string;
    email: string;
    name?: string | null;
    subscriptionStatus: string;
  };
}

export default function LabViewerClient({ material, student }: LabViewerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [frameSrc, setFrameSrc] = useState<string>("");

  useEffect(() => {
    // Resolve lab target URL safely in memory on client mount
    if (material.token) {
      try {
        const decoded = atob(material.token);
        setFrameSrc(decoded);
      } catch {
        setFrameSrc(`/api/student/lab-proxy/${material.id}`);
      }
    } else {
      setFrameSrc(`/api/student/lab-proxy/${material.id}`);
    }
  }, [material.token, material.id]);

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const watermarkText = `${student.email || student.id.slice(0, 8)} • PIECHEM SECURE LAB`;

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-screen w-screen bg-[#030911] text-slate-100 overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. TOP SECURE CONTROLS HEADER */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-[#06121f]/95 border-b border-cyan-500/20 backdrop-blur-md flex items-center justify-between shrink-0 z-30 shadow-lg shadow-black/50">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 hover:border-cyan-500/40 text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Vault</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 shrink-0">
              <Atom className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-spin-slow" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-white truncate flex items-center gap-2">
                <span>{material.title}</span>
                {material.isPremium ? (
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40">
                    👑 Premium
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    Free Lab
                  </span>
                )}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                Interactive 3D Virtual Chemistry Laboratory
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>DRM Protected Stream</span>
          </div>

          <button
            onClick={() => {
              setIsIframeLoading(true);
              setIframeKey(k => k + 1);
            }}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 hover:border-cyan-500/40 text-xs transition cursor-pointer"
            title="Reload Simulation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-cyan-500/20 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4" />
                <span className="hidden md:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4" />
                <span className="hidden md:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. LAB VIEWPORT & EMBED CONTAINER */}
      <div className="relative flex-1 w-full h-full bg-[#02060b] overflow-hidden">
        {/* Loading Spinner */}
        {isIframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#030911]/90 backdrop-blur-sm gap-3">
            <Atom className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-cyan-300">Initializing 3D Interactive Lab...</p>
              <p className="text-xs text-slate-400 font-mono">Establishing secure authenticated pipeline</p>
            </div>
          </div>
        )}

        {/* The Sandboxed In-App Iframe */}
        {frameSrc && (
          <iframe
            key={iframeKey}
            src={frameSrc}
            onLoad={() => setIsIframeLoading(false)}
            onError={() => {
              setFrameSrc(`/api/student/lab-proxy/${material.id}`);
            }}
            className="w-full h-full border-0 relative z-0 bg-[#06131d]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking; fullscreen"
            title={material.title}
          />
        )}

        {/* 3. ANTI-PIRACY FORENSIC FLOATING WATERMARK */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none select-none overflow-hidden grid grid-cols-2 sm:grid-cols-3 gap-24 p-8 opacity-[0.08]"
          aria-hidden="true"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i} 
              className="transform -rotate-25 text-[11px] font-mono font-bold tracking-widest text-cyan-400 whitespace-nowrap flex flex-col gap-1 items-center justify-center"
            >
              <span>{watermarkText}</span>
              <span className="text-[9px] opacity-75">LICENSED USER SESSION</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}