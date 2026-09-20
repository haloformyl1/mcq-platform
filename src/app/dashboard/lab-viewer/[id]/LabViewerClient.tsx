"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Atom, ShieldAlert } from "lucide-react";

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
  const [iframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [frameSrc, setFrameSrc] = useState<string>("");
  const [isScreenProtected, setIsScreenProtected] = useState(false);
  const [isConcurrentRevoked, setIsConcurrentRevoked] = useState(false);

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

  // Live session concurrency polling: kicks this device if student logs in on another device
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const res = await fetch("/api/student/session/heartbeat");
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (isMounted && data.active === false) {
            setIsConcurrentRevoked(true);
            setFrameSrc("");
          }
        }
      } catch {}
    };

    const interval = setInterval(checkSession, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

  const watermarkText = "Designed by Arghyadeep Roy \u2022 9830507435";

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

      {/* Concurrent Device Session Revocation Lockout Screen */}
      {isConcurrentRevoked && (
        <div className="fixed inset-0 z-[999999] bg-[#02060b] flex flex-col items-center justify-center p-4 select-none">
          <div className="max-w-md w-full bg-[#081524] border border-red-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-950/40">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-500/30">
                Single-Device Concurrency Limit
              </span>
              <h2 className="text-2xl font-black text-white">Session Terminated</h2>
              <p className="text-sm text-slate-300">
                Your student account was logged into on another device. In accordance with platform security rules, only one active device session is permitted at a time.
              </p>
            </div>
            <a
              href="/login?reason=concurrent_device"
              className="inline-block w-full py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm transition-all shadow-lg text-center"
            >
              Log In on This Device
            </a>
          </div>
        </div>
      )}

      {/* Screen Recording / Screenshot Active Blackout Screen */}
      {isScreenProtected && (
        <div 
          className="fixed inset-0 z-[999998] bg-black flex items-center justify-center cursor-pointer select-none"
          onClick={() => setIsScreenProtected(false)}
          title="Protected display: Click to return to simulation"
        />
      )}

      {/* Loading Spinner */}
      {isIframeLoading && !isConcurrentRevoked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#030911]/90 backdrop-blur-sm gap-3">
          <Atom className="w-10 h-10 text-cyan-400 animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-cyan-300">Loading 3D Simulation...</p>
            <p className="text-xs text-slate-400 font-mono">Connecting stream</p>
          </div>
        </div>
      )}

      {/* The 100% Fullscreen Clean In-App Iframe */}
      {frameSrc && !isConcurrentRevoked && (
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

      {/* Clean Creator Attribution Badge (Zero background noise, 100% study clarity) */}
      <div className="absolute bottom-3 right-3 z-30 pointer-events-none select-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#030911]/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wide shadow-2xl backdrop-blur-md opacity-90">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>{watermarkText}</span>
      </div>
    </div>
  );
}
