"use client";

import React from "react";
import Link from "next/link";

interface PiechemLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  href?: string;
}

export default function PiechemLogo({
  size = "md",
  showText = true,
  className = "",
  href
}: PiechemLogoProps) {
  // Dimensions for different sizes
  const dimensions = {
    sm: { icon: 28, text: "text-lg", gap: "gap-2" },
    md: { icon: 38, text: "text-xl sm:text-2xl", gap: "gap-3" },
    lg: { icon: 48, text: "text-2xl sm:text-3xl", gap: "gap-3.5" },
    xl: { icon: 64, text: "text-4xl sm:text-5xl", gap: "gap-4" },
  };

  const current = dimensions[size] || dimensions.md;

  const logoContent = (
    <div className={`flex items-center ${current.gap} select-none ${className}`}>
      {/* Icon Mark */}
      <div className="relative group shrink-0 flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full blur-md opacity-40 group-hover:opacity-75 transition duration-500"></div>

        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-[0_4px_12px_rgba(0,198,255,0.3)] transition-transform duration-300 transform group-hover:scale-105"
        >
          <defs>
            {/* Main Outer Hex Gradient */}
            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="50%" stopColor="#0066ff" />
              <stop offset="100%" stopColor="#7b2cbf" />
            </linearGradient>

            {/* Core Slice Gradient */}
            <linearGradient id="coreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3a7bd5" />
              <stop offset="100%" stopColor="#00d2ff" />
            </linearGradient>

            {/* Glowing Accent */}
            <radialGradient id="glowAccent" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Hexagonal Molecular Structure Frame */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill="none"
            stroke="url(#hexGrad)"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Inner Geometric Shield */}
          <polygon
            points="50,15 80,32 80,68 50,85 20,68 20,32"
            fill="#061325"
            fillOpacity="0.85"
            stroke="url(#hexGrad)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Molecular Node Circles (Corners) */}
          <circle cx="50" cy="6" r="3.5" fill="#00f2fe" />
          <circle cx="88" cy="28" r="3.5" fill="#0066ff" />
          <circle cx="88" cy="72" r="3.5" fill="#7b2cbf" />
          <circle cx="50" cy="94" r="3.5" fill="#00f2fe" />
          <circle cx="12" cy="72" r="3.5" fill="#0066ff" />
          <circle cx="12" cy="28" r="3.5" fill="#7b2cbf" />

          {/* Stylized Pie & Chemistry Orbit Symbol */}
          {/* Pie Slice 1 - Main Body */}
          <path
            d="M50 50 L50 24 A26 26 0 1 1 24 50 Z"
            fill="url(#coreGrad)"
            opacity="0.9"
          />

          {/* Pie Slice 2 - Floating Accent Wedge */}
          <path
            d="M54 46 L76 46 A26 26 0 0 0 54 24 Z"
            fill="#00f2fe"
          />

          {/* Center Orbital Core */}
          <circle cx="50" cy="50" r="6" fill="#ffffff" />
          <circle cx="50" cy="50" r="12" fill="url(#glowAccent)" />

          {/* Electron Orbital Rings */}
          <ellipse
            cx="50"
            cy="50"
            rx="32"
            ry="14"
            fill="none"
            stroke="#00f2fe"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            transform="rotate(-30 50 50)"
            opacity="0.75"
          />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`font-black tracking-wider font-sans uppercase flex items-center ${current.text}`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 drop-shadow-[0_2px_10px_rgba(0,242,254,0.3)]">
              PIE
            </span>
            <span className="text-white tracking-tight ml-0.5">
              CHEM
            </span>
          </div>
          <div className="text-[9px] sm:text-[10px] tracking-[0.25em] text-cyan-300/70 font-semibold uppercase mt-1">
            Exam Platform
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
