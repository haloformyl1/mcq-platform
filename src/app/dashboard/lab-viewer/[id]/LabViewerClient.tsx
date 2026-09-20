"use client";

import React, { useState, useRef, useEffect } from "react";
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

  const watermarkText = "Designed by Arghyadeep Roy • 9830507435";

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-screen bg-[#02060b] text-slate-100 overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
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