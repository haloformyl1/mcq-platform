'use client';

import React from 'react';

interface PiFiringLoaderProps {
  fullScreen?: boolean;
}

export default function PiFiringLoader({ fullScreen = true }: PiFiringLoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#02070B] text-white select-none overflow-hidden transition-opacity duration-500'
    : 'w-full py-16 sm:py-20 flex flex-col items-center justify-center bg-[#02070B]/95 rounded-2xl border border-white/[0.06] text-white select-none relative overflow-hidden backdrop-blur-md transition-opacity duration-500';

  return (
    <div className={containerClasses} role="status" aria-live="polite" aria-label="Loading PIE CHEM">
      {/* ========================================================================= */}
      {/* 1. ATMOSPHERIC BACKGROUND: Deep Navy & Ultra-Subtle Radial Cyan Glow     */}
      {/* ========================================================================= */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 46%, rgba(0, 210, 255, 0.08) 0%, rgba(3, 16, 24, 0.5) 38%, rgba(2, 7, 11, 0.98) 75%)',
        }}
      />

      {/* ========================================================================= */}
      {/* 2. OPTIONAL BACKGROUND SCIENTIFIC DETAIL: Faint Orbital Geometry (3-5%)  */}
      {/* ========================================================================= */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="geomGlow" cx="50%" cy="46%" r="50%">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#00d2ff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#geomGlow)" />

        {/* Faint precision orbital guides centered on the focal mark */}
        <circle
          cx="50%"
          cy="46%"
          r="170"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1"
          strokeDasharray="3 9"
          className="opacity-[0.06]"
        />
        <circle
          cx="50%"
          cy="46%"
          r="250"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="0.75"
          strokeDasharray="2 14"
          className="opacity-[0.035]"
        />
        {/* Subtle coordinate crosshair marks */}
        <line
          x1="calc(50% - 190px)"
          y1="46%"
          x2="calc(50% + 190px)"
          y2="46%"
          stroke="#00e5ff"
          strokeWidth="0.5"
          className="opacity-[0.03]"
        />
        <line
          x1="50%"
          y1="calc(46% - 190px)"
          x2="50%"
          y2="calc(46% + 190px)"
          stroke="#00e5ff"
          strokeWidth="0.5"
          className="opacity-[0.03]"
        />
      </svg>

      {/* ========================================================================= */}
      {/* 3. PRIMARY CENTRAL FOCAL SUITE (ELEGANT, SOPHISTICATED, RESTRAINED)      */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-sm w-full text-center">
        
        {/* Central Scientific Mark: Refined π Emblem & Calm Orbital Ring */}
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 mb-6">
          
          {/* Subtle breathing ambient aura */}
          <div className="absolute w-24 h-24 rounded-full bg-cyan-400/[0.08] blur-xl animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" />

          {/* Secondary outermost faint static ring */}
          <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-cyan-400/[0.12] pointer-events-none" />

          {/* Precision Orbital Ring (14s slow rotation) with single micro-particle */}
          <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full animate-[spin_14s_linear_infinite] pointer-events-none">
            {/* The circular path */}
            <div className="w-full h-full rounded-full border border-dashed border-cyan-400/30" />
            {/* Single delicate orbiting electron particle */}
            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(0,229,255,0.85)]" />
          </div>

          {/* Core Pi Badge: Dark Obsidian-Navy Disc with Soft Inner Illumination */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-b from-[#071926] to-[#030d16] border border-cyan-400/35 flex items-center justify-center shadow-[0_0_24px_rgba(0,229,255,0.18),inset_0_0_12px_rgba(0,229,255,0.1)]">
            {/* Stable Central Pi Symbol (No rapid spin, no bounce) */}
            <span className="text-2xl sm:text-3xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-300 drop-shadow-[0_0_8px_rgba(0,229,255,0.45)] select-none leading-none">
              {"\u03C0"}
            </span>
          </div>
        </div>

        {/* PIE CHEM Branding Hierarchy */}
        <div className="flex flex-col items-center justify-center space-y-1 mb-5">
          <div className="flex items-center text-base sm:text-lg font-black tracking-wider uppercase font-sans leading-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-200 drop-shadow-[0_1px_8px_rgba(0,229,255,0.3)]">
              PIE
            </span>
            <span className="text-white ml-1 tracking-tight drop-shadow-[0_1px_6px_rgba(255,255,255,0.2)]">
              CHEM
            </span>
          </div>
        </div>

        {/* Loading Message: Single, Muted, Calming */}
        <p className="text-xs sm:text-[13px] text-[#8ea4b3] font-normal tracking-wide mb-4 font-sans select-none">
          Preparing your learning experience...
        </p>

        {/* Loading Indicator: Minimal Hairline Progress Bar (Indeterminate Traveling Light) */}
        <div className="w-48 sm:w-56 h-[2px] bg-white/[0.08] rounded-full overflow-hidden relative backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 bottom-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_rgba(0,229,255,0.6)] animate-[subtleTravel_2.2s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. REFINED CSS KEYFRAMES (HARDWARE-ACCELERATED, BUTTER-SMOOTH)            */}
      {/* ========================================================================= */}
      <style jsx>{`
        @keyframes subtleTravel {
          0% {
            transform: translateX(-150%);
            opacity: 0.2;
          }
          30% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(350%);
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}
