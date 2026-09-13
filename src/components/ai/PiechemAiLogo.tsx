"use client";

import React from "react";

interface PiechemAiLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
}

const sizeMap = {
  xs: { icon: "w-4 h-4", text: "text-xs" },
  sm: { icon: "w-6 h-6", text: "text-sm" },
  md: { icon: "w-8 h-8", text: "text-base" },
  lg: { icon: "w-12 h-12", text: "text-xl" },
  xl: { icon: "w-16 h-16", text: "text-2xl" },
};

/**
 * Authentic PIECHEM Crystal Atom Emblem in Reddish-Black AI aesthetic.
 * Features crimson-scarlet gradients, deep noir obsidian plate,
 * ruby vertex jewels, and electric orbital rings.
 */
export default function PiechemAiLogo({
  className = "",
  size = "md",
  showText = false,
  animated = false,
}: PiechemAiLogoProps) {
  const current = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex shrink-0 items-center justify-center ${current.icon} ${animated ? 'animate-pulse' : ''}`}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full overflow-visible drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]"
        >
          <defs>
            {/* Outer Hexagon Crimson-to-Ruby Gradient */}
            <linearGradient id="piechemAiHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f0919" />
            </linearGradient>

            {/* Core Pie Sector Blood-to-Scarlet Gradient */}
            <linearGradient id="piechemAiCoreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ff2a4b" />
            </linearGradient>

            {/* Center Nucleus Radiant Ruby Glow */}
            <radialGradient id="piechemAiGlowAccent" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="40%" stopColor="#ff4d6d" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#b91c1c" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#450a0a" stopOpacity="0" />
            </radialGradient>

            {/* Planetary Orbital Ring Gradient */}
            <linearGradient id="piechemAiRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff758f" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>

          {/* Outer Cyber Hexagon */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill="none"
            stroke="url(#piechemAiHexGrad)"
            strokeWidth="5.5"
            strokeLinejoin="round"
          />

          {/* Inner Hexagon Plate with Obsidian-Noir Depth */}
          <polygon
            points="50,15 80,32 80,68 50,85 20,68 20,32"
            fill="#0c0204"
            fillOpacity="0.96"
            stroke="url(#piechemAiHexGrad)"
            strokeWidth="1.5"
            strokeOpacity="0.85"
          />

          {/* Hexagon Vertex Nodes: Radiant Ruby Jewels */}
          <circle cx="50" cy="6" r="4" fill="#ff4d6d" stroke="#7f0919" strokeWidth="1" />
          <circle cx="88" cy="28" r="4" fill="#ff2a4b" stroke="#7f0919" strokeWidth="1" />
          <circle cx="88" cy="72" r="4" fill="#dc2626" stroke="#ff4d6d" strokeWidth="1" />
          <circle cx="50" cy="94" r="4" fill="#ff2a4b" stroke="#7f0919" strokeWidth="1" />
          <circle cx="12" cy="72" r="4" fill="#dc2626" stroke="#ff4d6d" strokeWidth="1" />
          <circle cx="12" cy="28" r="4" fill="#ff4d6d" stroke="#7f0919" strokeWidth="1" />

          {/* Main Pie Sector (3/4 Circle) */}
          <path
            d="M50 50 L50 24 A26 26 0 1 1 24 50 Z"
            fill="url(#piechemAiCoreGrad)"
            opacity="0.96"
          />

          {/* Floating Ruby Quadrant Wedge */}
          <path
            d="M54 46 L76 46 A26 26 0 0 0 54 24 Z"
            fill="#ff2a4b"
          />

          {/* Center Pulsing Nucleus */}
          <circle cx="50" cy="50" r="14" fill="url(#piechemAiGlowAccent)" />
          <circle cx="50" cy="50" r="5" fill="#ffffff" />

          {/* Planetary Orbital Ring 1: Ruby Shimmer */}
          <ellipse
            cx="50"
            cy="50"
            rx="33"
            ry="14"
            fill="none"
            stroke="url(#piechemAiRingGrad)"
            strokeWidth="2"
            strokeDasharray="4 3"
            transform="rotate(-30 50 50)"
            opacity="0.95"
          />

          {/* Planetary Orbital Ring 2: Electric Scarlet Accent */}
          <ellipse
            cx="50"
            cy="50"
            rx="33"
            ry="14"
            fill="none"
            stroke="#ff2a4b"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            transform="rotate(30 50 50)"
            opacity="0.85"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none select-none">
          <div className={`font-black tracking-wider font-sans uppercase flex items-center ${current.text}`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff4d6d] via-[#ef4444] to-[#f43f5e] drop-shadow-[0_2px_10px_rgba(239,68,68,0.5)]">
              PIE
            </span>
            <span className="text-white tracking-tight ml-0.5">
              CHEM
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-red-950/80 border border-red-500/50 text-[10px] font-bold text-red-300 tracking-wider shadow-sm">
              AI
            </span>
          </div>
          <span className="text-[8px] font-extrabold tracking-[0.2em] text-red-400/90 uppercase mt-0.5">
            REDDISH BLACK AI
          </span>
        </div>
      )}
    </div>
  );
}
