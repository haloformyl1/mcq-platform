"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Pause, Play } from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

// Scientific 3D Molecular Node Definition
interface AtomNode {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  glow: string;
  emergeTime: number; // in ms when this atom blooms
}

interface BondLine {
  from: number;
  to: number;
  emergeTime: number;
}

export default function LandingIntroScreen() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Time & Sequence States (15.0s Total)
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);
  const redirectTriggeredRef = useRef(false);

  const TOTAL_DURATION = 15000; // 15.0 seconds // 7.0 seconds

  // Lock body scroll while splash screen is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 1. Precision Animation Frame Clock (0 to 15000ms)
  useEffect(() => {
    let animFrameId: number;

    const tick = (now: number) => {
      if (isPaused) {
        animFrameId = requestAnimationFrame(tick);
        return;
      }

      if (startTimeRef.current === null) {
        startTimeRef.current = now - pausedAtRef.current;
      }

      const currentElapsed = Math.min(TOTAL_DURATION, now - startTimeRef.current);
      setElapsed(currentElapsed);

      if (currentElapsed >= TOTAL_DURATION && !redirectTriggeredRef.current) {
        redirectTriggeredRef.current = true;
        handleTransitionToLogin();
        return;
      }

      if (currentElapsed < TOTAL_DURATION) {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    animFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameId);
  }, [isPaused]);

  // Handle Pause / Resume
  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPaused) {
      pausedAtRef.current = elapsed;
      startTimeRef.current = null;
      setIsPaused(true);
    } else {
      startTimeRef.current = null;
      setIsPaused(false);
    }
  };

  // Automated or Manual Transition to Login
  const handleTransitionToLogin = () => {
    setIsExiting(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("visited_landing", "true");
    }
    document.body.style.overflow = "";
    setTimeout(() => {
      router.push("/login");
    }, 550);
  };

  // Instant bypass button
  const handleBypass = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!redirectTriggeredRef.current) {
      redirectTriggeredRef.current = true;
      handleTransitionToLogin();
    }
  };

  // 2. Ultra-Premium 3D Molecular Laboratory Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Build Octahedral-Porphyrin Scientific Coordination Complex
    const atoms: AtomNode[] = [];
    const bonds: BondLine[] = [];

    // 0: Central Luminous Nucleus (Active from 0s)
    atoms.push({
      x: 0, y: 0, z: 0,
      radius: 5.5,
      color: "#FFFFFF",
      glow: "#5DE6FF",
      emergeTime: 0
    });

    // 1-6: Primary Octahedral Coordination Shell (emerges 900ms - 1500ms)
    const octDist = 85;
    const octCoords = [
      [octDist, 0, 0],
      [-octDist, 0, 0],
      [0, octDist, 0],
      [0, -octDist, 0],
      [0, 0, octDist],
      [0, 0, -octDist],
    ];

    octCoords.forEach((coord, i) => {
      atoms.push({
        x: coord[0],
        y: coord[1],
        z: coord[2],
        radius: 3.8,
        color: i % 2 === 0 ? "#5DE6FF" : "#7B7CFF",
        glow: i % 2 === 0 ? "rgba(93, 230, 255, 0.6)" : "rgba(123, 124, 255, 0.5)",
        emergeTime: 900 + i * 110
      });
      // Connect to center nucleus
      bonds.push({ from: 0, to: i + 1, emergeTime: 1000 + i * 100 });
    });

    // 7-18: Equatorial Aromatic Porphyrin Ring (emerges 1600ms - 2400ms)
    const ringRadius = 145;
    const ringCount = 12;
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      const zOffset = Math.sin(angle * 2) * 22;
      const idx = atoms.length;
      atoms.push({
        x: Math.cos(angle) * ringRadius,
        y: Math.sin(angle) * ringRadius,
        z: zOffset,
        radius: 2.8,
        color: i % 3 === 0 ? "#FFFFFF" : "#5DE6FF",
        glow: "rgba(93, 230, 255, 0.4)",
        emergeTime: 1500 + i * 80
      });

      // Connect perimeter ring
      if (i > 0) {
        bonds.push({ from: idx - 1, to: idx, emergeTime: 1600 + i * 80 });
      }
      if (i === ringCount - 1) {
        bonds.push({ from: idx, to: idx - ringCount + 1, emergeTime: 2400 });
      }

      // Inter-spoke bonds to inner octahedral nodes
      if (i % 2 === 0) {
        const targetOct = 1 + ((i / 2) % 4);
        bonds.push({ from: targetOct, to: idx, emergeTime: 1800 + i * 60 });
      }
    }

    // 19-30: Distal Outer Satellite Nodes (emerges 2200ms - 3000ms)
    const outerDist = 195;
    const outerCount = 8;
    for (let i = 0; i < outerCount; i++) {
      const phi = (i / outerCount) * Math.PI;
      const theta = i * 2.39996; // Golden ratio spiral
      const x = Math.sin(phi) * Math.cos(theta) * outerDist;
      const y = Math.sin(phi) * Math.sin(theta) * outerDist;
      const z = Math.cos(phi) * outerDist * 0.75;
      const idx = atoms.length;

      atoms.push({
        x, y, z,
        radius: 2.2,
        color: "#9298A3",
        glow: "rgba(123, 124, 255, 0.3)",
        emergeTime: 2200 + i * 90
      });

      bonds.push({ from: 1 + (i % 6), to: idx, emergeTime: 2400 + i * 80 });
    }

    // Directional Key Light Vector (normalized, from top-left-front)
    const lightDir = [-0.577, -0.577, 0.577];

    let rotY = 0.4;
    let rotX = 0.25;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const currentT = startTimeRef.current !== null 
        ? (isPaused ? pausedAtRef.current : performance.now() - startTimeRef.current) 
        : 0;

      // Slow, weighted scientific instrument precession
      rotY += 0.0016;
      rotX += 0.0008;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Camera focal distance
      const focal = 480;
      const cx = width / 2;
      const cy = height / 2;

      // Project all atoms
      const projected = atoms.map((atom, idx) => {
        // Assembly emergence factor (0 to 1)
        const age = currentT - atom.emergeTime;
        const emergence = Math.max(0, Math.min(1, age / 600));

        // Initial nucleation scale (starts at core and expands outward)
        const scaleFactor = 0.2 + 0.8 * emergence;
        const rawX = atom.x * scaleFactor;
        const rawY = atom.y * scaleFactor;
        const rawZ = atom.z * scaleFactor;

        // Rotate Y
        const x1 = rawX * cosY - rawZ * sinY;
        const z1 = rawZ * cosY + rawX * sinY;

        // Rotate X
        const y2 = rawY * cosX - z1 * sinX;
        const z2 = z1 * cosX + rawY * sinX;

        // Perspective
        const scale = focal / (focal + z2 + 220);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        // Directional lighting calculation on node surface
        const len = Math.sqrt(x1 * x1 + y2 * y2 + z2 * z2) || 1;
        const nx = x1 / len;
        const ny = y2 / len;
        const nz = z2 / len;
        const dot = Math.max(0.15, nx * lightDir[0] + ny * lightDir[1] + nz * lightDir[2]);

        return {
          idx,
          atom,
          px, py, pz: z2,
          scale,
          emergence,
          lighting: dot
        };
      });

      // Sort by depth (back to front)
      projected.sort((a, b) => a.pz - b.pz);

      // 1. Draw Bonds
      bonds.forEach((b) => {
        const p1 = projected.find((p) => p.idx === b.from);
        const p2 = projected.find((p) => p.idx === b.to);
        if (!p1 || !p2) return;

        const bondAge = currentT - b.emergeTime;
        if (bondAge <= 0) return;
        const bondAlpha = Math.min(1, bondAge / 500) * Math.min(p1.emergence, p2.emergence);
        if (bondAlpha <= 0.01) return;

        // Depth fading
        const avgDepth = (p1.pz + p2.pz) / 2;
        const depthFade = Math.max(0.08, Math.min(0.45, (focal - avgDepth) / (focal * 1.5)));

        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.strokeStyle = `rgba(93, 230, 255, ${depthFade * bondAlpha * 0.45})`;
        ctx.lineWidth = Math.max(0.5, 0.85 * ((p1.scale + p2.scale) / 2));
        ctx.stroke();
      });

      // 2. Draw Translucent Planetary Orbital Ring
      if (currentT > 1800) {
        const ringAlpha = Math.min(0.18, (currentT - 1800) / 1000);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotY * 0.45);
        ctx.beginPath();
        ctx.ellipse(0, 0, 150, 48, Math.PI / 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(93, 230, 255, ${ringAlpha})`;
        ctx.lineWidth = 0.75;
        ctx.setLineDash([3, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Atoms with Specular & Corona Shading
      projected.forEach(({ px, py, scale, atom, emergence, lighting }) => {
        if (emergence <= 0.01) return;

        const r = Math.max(1.2, atom.radius * scale * emergence);

        // Core soft corona
        const corona = ctx.createRadialGradient(px, py, 0, px, py, r * 3.5);
        corona.addColorStop(0, atom.glow);
        corona.addColorStop(1, "rgba(3, 4, 5, 0)");
        ctx.fillStyle = corona;
        ctx.beginPath();
        ctx.arc(px, py, r * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Solid atom sphere with directional lighting highlight
        ctx.fillStyle = atom.color;
        ctx.globalAlpha = Math.min(1, emergence * (0.6 + lighting * 0.4));
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Specular glint
        if (lighting > 0.4 && r > 2) {
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Cinematic Timeline Milestones
  // 0.0s - 1.0s: Initial dark void with pulsing node
  // 1.0s - 2.0s: Brand header & author badge appear
  // 2.0s - 3.5s: Complete molecule assembled
  // 3.5s - 5.0s: Hero headline "Chemistry, reimagined." appears with blur-to-sharp ease
  // 5.0s - 6.5s: Minimal capability strip & scientific metadata settle
  // 6.5s - 7.0s: Transition contraction to login
  const isPhase1 = elapsed >= 1000;
  const isPhase3 = elapsed >= 3500;
  const isPhase4 = elapsed >= 5000;
  const isPhase5 = elapsed >= 13500;

  // Exact progress line tracking 0% to 100% across 15000ms
  const progressPercent = Math.min(100, Math.max(0, (elapsed / TOTAL_DURATION) * 100));

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#030405] text-[#F5F5F2] flex flex-col justify-between overflow-hidden select-none selection:bg-cyan-500/20 selection:text-cyan-200 transition-all duration-700 ease-out ${
        isExiting ? "opacity-0 scale-[1.015] blur-md pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ backgroundColor: "#030405" }}
    >
      {/* Background Volumetric Directional Illumination behind the Molecule */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[55vw] h-[75vh] pointer-events-none opacity-40 blur-[130px] rounded-full z-0"
        style={{
          background: "radial-gradient(circle, rgba(93, 230, 255, 0.12) 0%, rgba(123, 124, 255, 0.05) 45%, transparent 75%)"
        }}
      />

      {/* Subtle Depth Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1] opacity-70 bg-[radial-gradient(ellipse_at_center,transparent_20%,#030405_95%)]"
      />

      {/* ============================================================ */}
      {/* TOP BAR: Minimalist Scientific Precision Header              */}
      {/* ============================================================ */}
      <header 
        className={`relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-5 sm:pt-7 flex items-center justify-between transition-all duration-1000 ease-out ${
          isPhase1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
      >
        {/* Far Left: PIECHEM Clean Wordmark */}
        <div className="flex items-center gap-3">
          <PiechemLogo size="md" isGoldMember={false}  />
        </div>

        {/* Far Right: Precision Scientific Instrumentation Status */}
        <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.07] backdrop-blur-md text-[10px] sm:text-[11px] font-mono tracking-[0.2em] text-[#9298A3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5DE6FF] shadow-[0_0_8px_#5DE6FF] animate-pulse" />
          <span className="text-white/40 hidden sm:inline">SYSTEM 01</span>
          <span className="text-white/20 hidden sm:inline">•</span>
        </div>
      </header>

      {/* ============================================================ */}
      {/* CENTER STAGE: Asymmetric Apple Keynote Spatial Composition   */}
      {/* ============================================================ */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 my-auto py-4 flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">
        
        {/* LEFT COLUMN: Editorial Typography Statement (Col 1-7) */}
        <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-5 sm:space-y-6 z-20">
          
          {/* Scientific Initiative Micro-Badge */}
          <div 
            className={`transition-all duration-1000 ease-out ${
              isPhase1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >

          </div>

          {/* Primary Statement: "Chemistry, reimagined." */}
          <div 
            className={`space-y-3 transition-all duration-1000 ease-out ${
              isPhase3 ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-[6px]"
            }`}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-[#F5F5F2] leading-[1.04]">
              <span className="font-serif italic font-light text-slate-100">
                Chemistry,
              </span>
              <br />
              <span className="font-sans font-extralight tracking-tight text-[#F5F5F2]">
                reimagined.
              </span>
            </h1>

            {/* Academic Scope: Minimal Line */}
            <p className="text-xs sm:text-sm font-mono tracking-[0.22em] text-[#9298A3] uppercase pt-1">
              PREPARATION FOR <span className="text-[#F5F5F2] font-normal">JEE</span> · <span className="text-[#F5F5F2] font-normal">NEET</span> · <span className="text-[#F5F5F2] font-normal">BOARDS</span>
            </p>

            {/* Supporting Text */}
            <p className="text-xs sm:text-sm text-[#9298A3]/85 font-light leading-relaxed max-w-md pt-0.5">
              Interactive learning engineered for scientific precision. Explore 3D molecular structures, master concepts through curated notes, and practice with AI-calibrated examinations.
            </p>
          </div>

          {/* Instrumentation Annotation */}
          <div 
            className={`text-[10px] font-mono tracking-[0.2em] text-[#9298A3]/60 transition-all duration-1000 ease-out ${
              isPhase4 ? "opacity-100" : "opacity-0"
            }`}
          >
            <span>[ MOLECULAR ENGINE // 100% NCERT ALIGNED ]</span>
          </div>
        </div>

        {/* RIGHT COLUMN: The Hero Scientific Molecular Object (Col 8-12) */}
        <div className="lg:col-span-5 relative h-[260px] sm:h-[340px] lg:h-[440px] w-full flex items-center justify-center pointer-events-none mt-2 lg:mt-0">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain"
          />

          {/* Scientific Coordinates Overlay */}
          <div 
            className={`absolute bottom-2 right-2 text-[9px] font-mono tracking-[0.25em] text-[#9298A3]/50 flex flex-col items-end gap-0.5 transition-all duration-1000 ${
              isPhase4 ? "opacity-100" : "opacity-0"
            }`}
          >
            <span>COORD: SP³D² OCTAHEDRAL</span>
            <span>PRECESSION: 0.0016 RAD/S</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* BOTTOM ANCHOR: Minimalist Capability Strip & Progress        */}
      {/* ============================================================ */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pb-5 sm:pb-7 space-y-3 shrink-0">
        
        {/* Capability Strip: Minimal Uppercase Typography (Phase 4) */}
        <div 
          className={`flex flex-wrap items-center justify-between gap-y-2 text-[10px] sm:text-[11px] font-mono tracking-[0.22em] text-[#9298A3] border-b border-white/[0.06] pb-3 transition-all duration-1000 ease-out ${
            isPhase4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1">
            <span className="hover:text-white transition-colors">3D MOLECULAR LABS</span>
            <span className="text-white/20">·</span>
            <span className="hover:text-white transition-colors">SMART NOTES</span>
            <span className="text-white/20">·</span>
            <span className="hover:text-white transition-colors">TEST ENGINE</span>
            <span className="text-white/20">·</span>
            <span className="hover:text-white transition-colors">AI CHEM TUTOR</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-white/40 text-[9.5px]">
            <span>ENGINEERED FOR SCIENTIFIC EXCELLENCE</span>
          </div>
        </div>

        {/* Instrumentation Progress Line & Seamless Transition */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 text-[10px] font-mono text-[#9298A3]">
          
          {/* Status Label */}
          <div className="flex items-center gap-2 tracking-[0.2em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5DE6FF] animate-ping" />
            <span className="text-[#F5F5F2]">
              {isPhase5 ? "ENTERING PIECHEM" : "INITIALIZING PIECHEM"}
            </span>
          </div>

          {/* Minimalist Hairline Progress Line */}
          <div className="w-full sm:max-w-xs relative h-[1.5px] bg-white/[0.08] overflow-hidden rounded-full my-auto">
            <div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-white/60 via-[#5DE6FF] to-white transition-all duration-100 ease-linear shadow-[0_0_8px_#5DE6FF]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Action Row: Pause & Instant Enter Bypass */}
          <div className="flex items-center gap-3 tracking-widest text-[10px]">
            <button
              type="button"
              onClick={togglePause}
              className="text-[#9298A3] hover:text-white transition-colors flex items-center gap-1.5"
              title={isPaused ? "Resume sequence" : "Pause sequence"}
            >
              {isPaused ? (
                <>
                  <Play className="w-2.5 h-2.5 text-emerald-400" />
                  <span>RESUME</span>
                </>
              ) : (
                <>
                  <Pause className="w-2.5 h-2.5 text-[#9298A3]" />
                  <span>PAUSE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBypass}
              className="group inline-flex items-center gap-1 text-[#F5F5F2] hover:text-[#5DE6FF] transition-colors font-medium"
            >
              <span>ENTER NOW</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 text-[#5DE6FF]" />
            </button>
          </div>

        </div>

      </footer>
    </div>
  );
}
