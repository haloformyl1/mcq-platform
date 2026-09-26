"use client";

import React from "react";
import MolecularOrbitalCanvas from "@/components/3d/MolecularOrbitalCanvas";

export default function GlobalBackground() {
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full max-w-full bg-[#02070B] select-none"
      style={{ overflow: "hidden", maxWidth: "100vw" }}
    >
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 46%, rgba(0, 210, 255, 0.08) 0%, rgba(3, 16, 24, 0.5) 38%, rgba(2, 7, 11, 0.98) 75%)',
        }}
      />
      {/* Subtle Native Molecular Orbital Canvas Animation spanning full screen */}
      <MolecularOrbitalCanvas 
        className="absolute inset-0 pointer-events-none opacity-40" 
        density="subtle" 
      />
    </div>
  );
}
