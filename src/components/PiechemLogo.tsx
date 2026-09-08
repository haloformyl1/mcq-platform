"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface PiechemLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  href?: string;
  isGoldMember?: boolean;
  theme?: 'dark' | 'light';
}

export default function PiechemLogo({
  size = "md",
  showText = true,
  className = "",
  href,
  isGoldMember,
  theme = 'dark'
}: PiechemLogoProps) {
  const [isGold, setIsGold] = useState<boolean>(isGoldMember ?? false);

  useEffect(() => {
    if (isGoldMember !== undefined) {
      setIsGold(isGoldMember);
      return;
    }

    const checkGoldStatus = () => {
      try {
        if (typeof window !== "undefined") {
          const path = window.location.pathname || "";
          // Never show gold on admin portal or public authentication pages
          if (path.startsWith("/admin") || path === "/login" || path === "/onboarding") {
            setIsGold(false);
            return;
          }
        }

        const stored = localStorage.getItem("piechem_is_gold");
        if (stored !== "true") {
          setIsGold(false);
          return;
        }

        const isComplimentary = localStorage.getItem("piechem_is_complimentary") === "true";
        if (isComplimentary) {
          setIsGold(true);
          return;
        }

        const expiresAt = localStorage.getItem("piechem_gold_expires_at");
        if (expiresAt) {
          const expiryMs = new Date(expiresAt).getTime();
          if (!isNaN(expiryMs)) {
            if (Date.now() >= expiryMs) {
              // Instantly revert to original logo when expired and clear storage
              localStorage.removeItem("piechem_is_gold");
              localStorage.removeItem("piechem_gold_expires_at");
              localStorage.removeItem("piechem_is_complimentary");
              setIsGold(false);
              window.dispatchEvent(new Event("piechem_gold_status_changed"));
              return;
            }
            setIsGold(true);
            return;
          }
        }

        // Legacy or unverified flag without expiration metadata: clean up and show original logo
        localStorage.removeItem("piechem_is_gold");
        setIsGold(false);
      } catch {
        setIsGold(false);
      }
    };

    checkGoldStatus();

    // 1-second interval to guarantee instant logo reversal the moment subscription expires
    const interval = setInterval(checkGoldStatus, 1000);

    window.addEventListener("piechem_gold_status_changed", checkGoldStatus);
    window.addEventListener("storage", checkGoldStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("piechem_gold_status_changed", checkGoldStatus);
      window.removeEventListener("storage", checkGoldStatus);
    };
  }, [isGoldMember]);

  const dimensions = {
    sm: { icon: 28, text: "text-lg", gap: "gap-2" },
    md: { icon: 38, text: "text-xl sm:text-2xl", gap: "gap-2.5 sm:gap-3" },
    lg: { icon: 48, text: "text-2xl sm:text-3xl", gap: "gap-3.5" },
    xl: { icon: 64, text: "text-4xl sm:text-5xl", gap: "gap-4" },
  };

  const current = dimensions[size] || dimensions.md;

  const logoContent = (
    <div className={"flex items-center " + current.gap + " select-none " + className}>
      {/* Icon with Dynamic Dual Golden-Blue Ambient Aura */}
      <div className="relative group shrink-0 flex items-center justify-center">
        {isGold ? (
          // Ultra-Premium Golden-Electric Blue Aura Glow
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-500/70 via-cyan-400/60 to-yellow-400/80 rounded-2xl blur-md opacity-85 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
        ) : (
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full blur-md opacity-40 group-hover:opacity-75 transition duration-500"></div>
        )}

        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={
            "relative transition-transform duration-300 transform group-hover:scale-105 " +
            (isGold
              ? "drop-shadow-[0_4px_20px_rgba(245,158,11,0.55)]"
              : "drop-shadow-[0_4px_12px_rgba(0,198,255,0.3)]")
          }
        >
          <defs>
            {isGold ? (
              <>
                {/* 1. Golden-Blue Hybrid Hexagon Gradient: Gold flowing into Electric Azure Cyan */}
                <linearGradient id="goldBlueHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF275" />
                  <stop offset="28%" stopColor="#F59E0B" />
                  <stop offset="55%" stopColor="#00F2FE" />
                  <stop offset="80%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                {/* 2. Core Pi/Slice Gradient: Molten Gold to Radiant Sapphire */}
                <linearGradient id="goldBlueCoreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#B45309" />
                  <stop offset="35%" stopColor="#F59E0B" />
                  <stop offset="70%" stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>

                {/* 3. Center Nucleus Radial Glow */}
                <radialGradient id="goldBlueGlowAccent" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                  <stop offset="45%" stopColor="#FDE047" stopOpacity="0.85" />
                  <stop offset="75%" stopColor="#00E5FF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
                </radialGradient>

                {/* 4. Dual Ring Gradients */}
                <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF275" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>

                <linearGradient id="blueRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00F2FE" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </>
            ) : (
              <>
                <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="50%" stopColor="#0066ff" />
                  <stop offset="100%" stopColor="#7b2cbf" />
                </linearGradient>

                <linearGradient id="coreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3a7bd5" />
                  <stop offset="100%" stopColor="#00d2ff" />
                </linearGradient>

                <radialGradient id="glowAccent" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
                </radialGradient>
              </>
            )}
          </defs>

          {/* Outer Cyber Hexagon */}
          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill="none"
            stroke={isGold ? "url(#goldBlueHexGrad)" : "url(#hexGrad)"}
            strokeWidth={isGold ? "5.5" : "5"}
            strokeLinejoin="round"
          />

          {/* Inner Hexagon Plate with Obsidian-Navy Depth */}
          <polygon
            points="50,15 80,32 80,68 50,85 20,68 20,32"
            fill={isGold ? "#050d1a" : "#061325"}
            fillOpacity="0.95"
            stroke={isGold ? "url(#goldBlueHexGrad)" : "url(#hexGrad)"}
            strokeWidth="1.5"
            strokeOpacity={isGold ? "0.9" : "0.6"}
          />

          {/* Hexagon Vertex Nodes: Alternating Gold and Cyan-Blue Jewels */}
          <circle cx="50" cy="6" r="4" fill={isGold ? "#FFF275" : "#00f2fe"} stroke={isGold ? "#D97706" : "none"} strokeWidth={isGold ? "1" : "0"} />
          <circle cx="88" cy="28" r="4" fill={isGold ? "#00E5FF" : "#0066ff"} stroke={isGold ? "#1E3A8A" : "none"} strokeWidth={isGold ? "1" : "0"} />
          <circle cx="88" cy="72" r="4" fill={isGold ? "#F59E0B" : "#7b2cbf"} stroke={isGold ? "#FFF275" : "none"} strokeWidth={isGold ? "1" : "0"} />
          <circle cx="50" cy="94" r="4" fill={isGold ? "#00E5FF" : "#00f2fe"} stroke={isGold ? "#1E3A8A" : "none"} strokeWidth={isGold ? "1" : "0"} />
          <circle cx="12" cy="72" r="4" fill={isGold ? "#F59E0B" : "#0066ff"} stroke={isGold ? "#FFF275" : "none"} strokeWidth={isGold ? "1" : "0"} />
          <circle cx="12" cy="28" r="4" fill={isGold ? "#FFF275" : "#7b2cbf"} stroke={isGold ? "#D97706" : "none"} strokeWidth={isGold ? "1" : "0"} />

          {/* Main Pie Sector (3/4 circle) */}
          <path
            d="M50 50 L50 24 A26 26 0 1 1 24 50 Z"
            fill={isGold ? "url(#goldBlueCoreGrad)" : "url(#coreGrad)"}
            opacity="0.95"
          />

          {/* Golden/Cyan Quadrant Wedge */}
          <path
            d="M54 46 L76 46 A26 26 0 0 0 54 24 Z"
            fill={isGold ? "#00E5FF" : "#00f2fe"}
          />

          {/* Center Pulsing Nucleus */}
          <circle cx="50" cy="50" r="14" fill={isGold ? "url(#goldBlueGlowAccent)" : "url(#glowAccent)"} />
          <circle cx="50" cy="50" r="6" fill="#ffffff" />

          {/* Planetary Orbital Ring 1: Shimmering Gold */}
          <ellipse
            cx="50"
            cy="50"
            rx="33"
            ry="14"
            fill="none"
            stroke={isGold ? "url(#goldRingGrad)" : "#00f2fe"}
            strokeWidth={isGold ? "2" : "1.5"}
            strokeDasharray="4 3"
            transform="rotate(-30 50 50)"
            opacity={isGold ? "0.95" : "0.75"}
          />

          {/* Planetary Orbital Ring 2: Intersecting Electric Cyan */}
          <ellipse
            cx="50"
            cy="50"
            rx="33"
            ry="14"
            fill="none"
            stroke={isGold ? "url(#blueRingGrad)" : "none"}
            strokeWidth="2"
            strokeDasharray="4 3"
            transform="rotate(30 50 50)"
            opacity={isGold ? "0.95" : "0"}
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={"font-black tracking-wider font-sans uppercase flex items-center " + current.text}>
            {isGold ? (
              <>
                {/* Luminous Electric Cyan-to-Sky Blue for PIE */}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00F2FE] via-[#38BDF8] to-[#67E8F9] drop-shadow-[0_2px_12px_rgba(0,242,254,0.45)]">
                  PIE
                </span>
                {/* Gleaming 24K Gold for CHEM */}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FEF08A] via-[#FBBF24] to-[#F59E0B] tracking-tight ml-0.5 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
                  CHEM
                </span>
              </>
            ) : (
              <>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 drop-shadow-[0_2px_10px_rgba(0,242,254,0.3)]">
                  PIE
                </span>
                <span className={(theme === 'light' ? 'text-neutral-900' : 'text-white') + ' tracking-tight ml-0.5'}>
                  CHEM
                </span>
              </>
            )}
          </div>
          
          {/* Subtitle with VIP Gold Badge */}
          {isGold ? (
            <div className="flex items-center gap-1.5 text-[8.5px] sm:text-[9.5px] tracking-[0.18em] font-extrabold uppercase mt-1">
              <span className="text-cyan-400/90 font-bold">EXAM PLATFORM</span>
              <span className="text-amber-400">•</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-cyan-500/20 border border-amber-500/40 text-amber-300 text-[8px] font-black tracking-wider shadow-sm">
                <span>⭐</span> GOLD
              </span>
            </div>
          ) : (
            <div
              className={
                "text-[9px] sm:text-[10px] tracking-[0.25em] font-semibold uppercase mt-1 " +
                (theme === 'light' ? 'text-cyan-700 font-bold' : 'text-cyan-300/70')
              }
            >
              Exam Platform
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-95 transition-all">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
