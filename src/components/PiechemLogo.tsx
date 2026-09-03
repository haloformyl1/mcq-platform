"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface PiechemLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  href?: string;
  isGoldMember?: boolean;
}

export default function PiechemLogo({
  size = "md",
  showText = true,
  className = "",
  href,
  isGoldMember
}: PiechemLogoProps) {
  const [isGold, setIsGold] = useState<boolean>(isGoldMember ?? false);

  useEffect(() => {
    if (isGoldMember !== undefined) {
      setIsGold(isGoldMember);
      return;
    }

    const checkGoldStatus = () => {
      try {
        const stored = localStorage.getItem("piechem_is_gold");
        setIsGold(stored === "true");
      } catch {
        setIsGold(false);
      }
    };

    checkGoldStatus();

    window.addEventListener("piechem_gold_status_changed", checkGoldStatus);
    window.addEventListener("storage", checkGoldStatus);

    return () => {
      window.removeEventListener("piechem_gold_status_changed", checkGoldStatus);
      window.removeEventListener("storage", checkGoldStatus);
    };
  }, [isGoldMember]);

  const dimensions = {
    sm: { icon: 28, text: "text-lg", gap: "gap-2" },
    md: { icon: 38, text: "text-xl sm:text-2ll", gap: "gap-3" },
    lg: { icon: 48, text: "text-2xl sm:text-3xl", gap: "gap-3.5" },
    xl: { icon: 64, text: "text-4xl sm:text-5xl", gap: "gap-4" },
  };

  const current = dimensions[size] || dimensions.md;

  const logoContent = (
    <div className={"flex items-center " + current.gap + " select-none " + className}>
      <div className="relative group shrink-0 flex items-center justify-center">
        {isGold ? (
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-500 via-amber-300 to-cyan-400 rounded-full blur-md opacity-80 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
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
              ? "drop-shadow-[0_4px_16px_rgba(245,158,11,0.65)]"
              : "drop-shadow-[0_4px_12px_rgba(0,198,255,0.3)]")
          }
        >
          <defs>
            {isGold ? (
              <>
                <linearGradient id="goldHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFE57F" />
                  <stop offset="35%" stopColor="#F59E0B" />
                  <stop offset="70%"stopColor="#00E5FF" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>

                <linearGradient id="goldCoreGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>

                <radialGradient id="goldGlowAccent" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                </radialGradient>
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

          <polygon
            points="50,6 88,28 88,72 50,94 12,72 12,28"
            fill="none"
            stroke={isGold ? "url(#goldHexGrad)" : "url(#hexGrad)"}
            strokeWidth={isGold ? "6" : "5"}
            strokeLinejoin="round"
          />

          <polygon
            points="50,15 80,32 80,68 50,85 20,68 20,32"
            fill={isGold ? "#09101d" : "#061325"}
            fillOpacity="0.9"
            stroke={isGold ? "url(#goldHexGrad)" : "url(#hexGrad)"}
            strokeWidth="1.5"
            strokeOpacity={isGold ? "0.85" : "0.6"}
          />

          <circle cx="50" cy="6" r="3.5" fill={isGold ? "#FFE57F" : "#00f2fe"} />
          <circle cx="88" cy="28" r="3.5" fill={isGold ? "#00E5FF" : "#0066ff"} />
          <circle cx="88" cy="72" r="3.5" fill={isGold ? "#F59E0B" : "#7b2cbf"} />
          <circle cx="50" cy="94" r="3.5" fill={isGold ? "#00E5FF" : "#00f2fe"} />
          <circle cx="12" cy="72" r="3.5" fill={isGold ? "#F59E0B" : "#0066ff"} />
          <circle cx="12" cy="28" r="3.5" fill={isGold ? "#FFE57F" : "#7b2cbf"} />

          <path
            d="M50 50 L50 24 A26 26 0 1 1 24 50 Z"
            fill={isGold ? "url(#goldCoreGrad)" : "url(#coreGrad)"}
            opacity="0.95"
          />

          <path
            d="M54 46 L76 46 A26 26 0 0 0 54 24 Z"
            fill={isGold ? "#00E5FF" : "#00f2fe"}
          />

          <circle cx="50" cy="50" r="6" fill="#ffffff" />
          <circle cx="50" cy="50" r="12" fill={isGold ? "url(#goldGlowAccent)" : "url(#glowAccent)"} />

          <ellipse
            cx="50"
            cy="50"
            rx="32"
            ry="14"
            fill="none"
            stroke={isGold ? "#FFE57F" : "#00f2fe"}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            transform="rotate(-30 50 50)"
            opacity={isGold ? "0.9" : "0.75"}
          />
          {isGold && (
            <ellipse
              cx="50"
              cy="50"
              rx="32"
              ry="14"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              transform="rotate(30 50 50)"
              opacity="0.75"
            />
          )}
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={"font-black tracking-wider font-sans uppercase flex items-center " + current.text}>
            {isGold ? (
              <>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-cyan-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]">
                  PIE
                </span>
                <span className="text-white tracking-tight ml-0.5 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                  CHEM
                </span>
              </>
            ) : (
              <>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 drop-shadow-[0_2px_10px_rgba(0,242,254,0.3)]">
                  PIE
                </span>
                <span className="text-white tracking-tight ml-0.5">
                  CHEM
                </span>
              </>
            )}
          </div>
          <div
            className={
              "text-[9px] sm:text-[10px] tracking-[0.25em] font-semibold uppercase mt-1 " +
              (isGold ? "text-amber-300/90 font-bold" : "text-cyan-300/70")
            }
          >
            {isGold ? "GOLD EXAM PLATFORM" : "Exam Platform"}
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
