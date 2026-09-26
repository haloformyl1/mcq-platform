"use client";

import React from "react";
import MolecularOrbitalCanvas from "@/components/3d/MolecularOrbitalCanvas";

export default function GlobalBackground() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full max-w-full bg-gradient-to-br from-[#0a3147] via-[#030f17] to-black select-none"
      style={{ overflow: "hidden", maxWidth: "100vw" }}
    >
      {/* 1. Subtle Native Molecular Orbital Canvas Animation spanning full screen */}
      <MolecularOrbitalCanvas 
        className="absolute inset-0 pointer-events-none opacity-50" 
        density="subtle" 
      />

      {/* 2. Superb Chemistry Ambient Lighting & Radial Glow with OLED Black Falloff */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_75%_35%,rgba(0,195,255,0.15),transparent_75%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_15%_75%,rgba(0,195,255,0.08),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.06),transparent_70%)]" />

      {/* 3. Faint Orbital Curves & Scientific Geometry */}
      <div className="absolute -right-12 top-24 w-72 sm:w-[480px] h-72 sm:h-[480px] border border-cyan-500/14 rounded-full blur-[0.5px]" />
      <div className="absolute -right-24 top-12 w-96 sm:w-[640px] h-96 sm:h-[640px] border border-cyan-500/8 rounded-full" />
      <div className="absolute right-28 top-44 w-48 sm:w-80 h-48 sm:h-80 border border-indigo-500/10 rounded-full" />
      
      {/* Bottom subtle orbital curve for depth across the page */}
      <div className="absolute -left-20 bottom-24 w-[420px] sm:w-[580px] h-[420px] sm:h-[580px] border border-cyan-500/6 rounded-full" />
    </div>
  );
}
