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

  const triggerBlackout = useCallback(() => {
    // Disabled to prevent user frustration
  }, []);

  useEffect(() => {
    // Anti-screenshot disabled
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#02060b] text-slate-100 overflow-hidden select-none"
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
    </div>
  );
}
