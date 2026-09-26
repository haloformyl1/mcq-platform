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
 * Authentic PIECHEM Crystal Atom Emblem in OLED Dark AI aesthetic.
 * Features titanium-cyber gradients, pure obsidian plate,
 * luminous vertex jewels, and electric azure-platinum orbital rings.
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
          className="h-full w-full overflow-visible drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]"
        >
          <defs>
            {/* Outer Hexagon Titanium-Azure Gradient */}
            <linearGradient id="piechemAiHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Core Pie Sector Electric Azure Gradient */}
            <linearGradient id="piechemAiCoreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0c4a6e" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Center Nucleus Radiant White Glow */}
            <radialGradient id="piechemAiGlowAccent" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="75%" stopColor="#0369a1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0" />
            </radialGradient>

            {/* Planetary Orbital Ring Gradient */}
            <linearGradient id="piechemAiRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>

          {/* Outer Cyber Hexagon */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill="none"
            stroke="url(#piechemAiHexGrad)"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Inner Hexagon Plate with Pure Obsidian OLED Depth */}
          <polygon
            points="50,15 80,32 80,68 50,85 20,68 20,32"
            fill="#050505"
            fillOpacity="0.98"
            stroke="url(#piechemAiHexGrad)"
            strokeWidth="1.5"
            strokeOpacity="0.75"
          />

          {/* Hexagon Vertex Nodes: Radiant Crystals */}
          <circle cx="50" cy="6" r="3.5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="1" />
          <circle cx="88" cy="28" r="3.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
          <circle cx="88" cy="72" r="3.5" fill="#0ea5e9" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="50" cy="94" r="3.5" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
          <circle cx="12" cy="72" r="3.5" fill="#0ea5e9" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="12" cy="28" r="3.5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="1" />

          {/* Main Pie Sector (3/4 Circle) */}
          <path
            d="M50 50 L50 24 A26 26 0 1 1 24 50 Z"
            fill="url(#piechemAiCoreGrad)"
            opacity="0.95"
          />

          {/* Floating Cyan Quadrant Wedge */}
          <path
            d="M54 46 L76 46 A26 26 0 0 0 54 24 Z"
            fill="#38bdf8"
          />

          {/* Center Pulsing Nucleus */}
          <circle cx="50" cy="50" r="14" fill="url(#piechemAiGlowAccent)" />
          <circle cx="50" cy="50" r="5" fill="#ffffff" />

          {/* Planetary Orbital Ring 1: Titanium Shimmer */}
          <ellipse
            cx="50"
            cy="50"
            rx="33"
            ry="14"
            fill="none"
            stroke="url(#piechemAiRingGrad)"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            transform="rotate(-30 50 50)"
            opacity="0.9"
          />

          {/* Planetary Orbital Ring 2: Electric Azure Accent */}
          <ellipse
            cx="50"
            cy="50"
            rx="33"
            ry="14"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeDasharray="4 3"
            transform="rotate(30 50 50)"
            opacity="0.85"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none select-none">
          <div className={`font-black tracking-wider font-sans uppercase flex items-center ${current.text}`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow-[0_2px_10px_rgba(56,189,248,0.4)]">
              PIE
            </span>
            <span className="text-white tracking-tight ml-0.5">
              CHEM
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-bold text-white tracking-wider shadow-sm">
              AI
            </span>
          </div>
          <span className="text-[8px] font-extrabold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
            SMART TUTOR
          </span>
        </div>
      )}
    </div>
  );
}
