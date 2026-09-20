"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Atom } from "lucide-react";

interface LabViewerClientProps {
  material: {
    id: string;
    title: string;
    description?: string | null;
    isPremium: boolean;
    token?: string;
  };
  student?: {
    id: string;
    email: string;
    name?: string | null;
    subscriptionStatus: string;
  };
}

export default function LabViewerClient({ material }: LabViewerClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [frameSrc, setFrameSrc] = useState<string>("");
  const [isScreenProtected, setIsScreenProtected] = useState(false);

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

  // Anti-Screenshot & Screen Recording Blackout Engine
  const triggerBlackout = useCallback(() => {
    setIsScreenProtected(true);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText("");
      }
    } catch {}

    // Auto-restore after 3s if window is still focused
    setTimeout(() => {
      if (document.hasFocus()) {
        setIsScreenProtected(false);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    // 1. Defocus / Blur detection (Fires when Snipping tool, OBS, Screen capture app, or OS multitasking appears)
    const handleBlur = () => {
      setTimeout(() => {
        // If focus is inside our 3D simulation canvas iframe, user is interacting normally
        if (document.activeElement === iframeRef.current) {
          return;
        }
        setIsScreenProtected(true);
      }, 80);
    };

    const handleFocus = () => {
      setTimeout(() => {
        setIsScreenProtected(false);
      }, 250);
    };

    // 2. Visibility change (Fires when switching tabs, minimizing, or opening recording overlay on Android/iOS)
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setIsScreenProtected(true);
      } else if (document.visibilityState === "visible") {
        setTimeout(() => setIsScreenProtected(false), 250);
      }
    };

    // 3. Screenshot keyboard shortcut interception
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerBlackout();
        return;
      }

      // Windows: Win+Shift+S / Ctrl+Shift+S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        triggerBlackout();
        return;
      }

      // macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        triggerBlackout();
        return;
      }

      // Print / PDF capture: Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        triggerBlackout();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        triggerBlackout();
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [triggerBlackout]);

  const watermarkText = "Designed by Arghyadeep Roy • 9830507435";

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-screen bg-[#02060b] text-slate-100 overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dynamic Anti-Capture Print Protection */}
      <style jsx global>{`
        @media print {
          html, body, div, iframe {
            display: none !important;
            visibility: hidden !important;
            background: #000000 !important;
          }
        }
      `}</style>

      {/* Screen Recording / Screenshot Active Blackout Screen */}
      {isScreenProtected && (
        <div 
          className="fixed inset-0 z-[999999] bg-black flex items-center justify-center cursor-pointer select-none"
          onClick={() => setIsScreenProtected(false)}
          title="Protected display: Click to return to simulation"
        />
      )}

      {/* Loading Spinner */}
      {isIframeLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#030911]/90 backdrop-blur-sm gap-3">
          <Atom className="w-10 h-10 text-cyan-400 animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-cyan-300">Loading 3D Simulation...</p>
            <p className="text-xs text-slate-400 font-mono">Connecting stream</p>
          </div>
        </div>
      )}

      {/* The 100% Fullscreen Clean In-App Iframe */}
      {frameSrc && (
        <iframe
          ref={iframeRef}
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

      {/* Branding Watermark */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none select-none overflow-hidden grid grid-cols-2 sm:grid-cols-3 gap-24 p-8 opacity-[0.08]"
        aria-hidden="true"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div 
            key={i} 
            className="transform -rotate-25 text-[11px] font-mono font-bold tracking-widest text-cyan-400 whitespace-nowrap flex items-center justify-center"
          >
            <span>{watermarkText}</span>
          </div>
        ))}
      </div>
    </div>
  );
}