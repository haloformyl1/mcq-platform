"use client";

import React from "react";
import MolecularOrbitalCanvas from "@/components/3d/MolecularOrbitalCanvas";

export default function GlobalBackground() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black select-none"
    >
      {/* 1. Subtle Native Molecular Orbital Canvas Animation */}
      <MolecularOrbitalCanvas 
        className="absolute inset-0 pointer-events-none opacity-45" 
        density="subtle" 
      />

      {/* 2. Ambient Lighting & Chemistry Radial Glow with OLED Black Falloff */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_75%_25%,rgba(0,195,255,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_75%,rgba(0,195,255,0.05),transparent_65%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      {/* 3. Faint Orbital Curves & Scientific Geometry */}
      <div className="absolute -right-16 -top-16 w-[480px] sm:w-[680px] h-[480px] sm:h-[680px] border border-cyan-500/12 rounded-full blur-[0.5px]" />
      <div className="absolute -right-32 -top-32 w-[680px] sm:w-[920px] h-[680px] sm:h-[920px] border border-cyan-500/6 rounded-full" />
      <div className="absolute right-24 top-24 w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] border border-indigo-500/8 rounded-full" />
      
      {/* Bottom subtle orbital curve for depth */}
      <div className="absolute -left-20 bottom-24 w-[420px] sm:w-[580px] h-[420px] sm:h-[580px] border border-cyan-500/6 rounded-full" />
    </div>
  );
}
