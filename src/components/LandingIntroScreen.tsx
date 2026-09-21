"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Atom, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Pause, 
  Play
} from "lucide-react";
import PiechemLogo from "@/components/PiechemLogo";

// Scientific 3D Molecular Orbital Node Structure
interface MolecularNode {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  radius: number;
  color: string;
}

export default function LandingIntroScreen() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Time & Animation Sequence (7.0s Total)
  const [elapsed, setElapsed] = useState(0); // milliseconds
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);
  const redirectTriggeredRef = useRef(false);

  const TOTAL_DURATION = 7000; // 7 seconds

  // Lock body scroll during splash screen
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 1. High-precision animation frame timer for the 7.0s sequence
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
        handleCompleteRedirect();
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

  // Automated or Instant Redirect
  const handleCompleteRedirect = () => {
    setIsExiting(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("visited_landing", "true");
    }
    document.body.style.overflow = "";
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  // Instant bypass button for returning users
  const handleEnterNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!redirectTriggeredRef.current) {
      redirectTriggeredRef.current = true;
      handleCompleteRedirect();
    }
  };

  // 2. Sophisticated 3D Molecular Orbital Canvas Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Generate sophisticated molecular cluster (Tetrahedral & Icosahedral geometry)
    const nodes: MolecularNode[] = [];
    const colors = ["#00D9FF", "#248BFF", "#8B5CF6", "#38BDF8", "#A78BFA"];

    // Nucleus & inner core
    nodes.push({ x: 0, y: 0, z: 0, baseX: 0, baseY: 0, baseZ: 0, radius: 4.5, color: "#00D9FF" });

    // Inner orbital sphere (radius ~120px)
    const count1 = 12;
    for (let i = 0; i < count1; i++) {
      const phi = Math.acos(-1 + (2 * i) / count1);
      const theta = Math.sqrt(count1 * Math.PI) * phi;
      const r = 110 + (i % 3) * 15;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);
      nodes.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        radius: 2 + (i % 3) * 0.8,
        color: colors[i % colors.length]
      });
    }

    // Outer orbital shell (radius ~220px)
    const count2 = 18;
    for (let i = 0; i < count2; i++) {
      const phi = Math.acos(-1 + (2 * i) / count2);
      const theta = Math.sqrt(count2 * Math.PI) * phi * 1.2;
      const r = 210 + (i % 4) * 20;
      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);
      nodes.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        radius: 1.5 + (i % 2) * 0.8,
        color: colors[(i + 2) % colors.length]
      });
    }

    let angleX = 0.0012;
    let angleY = 0.0022;
    let currentRotationY = 0;
    let currentRotationX = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle ambient background illumination
      const cx = width / 2;
      const cy = height / 2;

      // Draw faint center glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.6);
      grad.addColorStop(0, "rgba(0, 217, 255, 0.045)");
      grad.addColorStop(0.4, "rgba(36, 139, 255, 0.02)");
      grad.addColorStop(0.8, "rgba(139, 92, 246, 0.01)");
      grad.addColorStop(1, "rgba(5, 6, 8, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Update rotation
      currentRotationY += angleY;
      currentRotationX += angleX;

      const cosY = Math.cos(currentRotationY);
      const sinY = Math.sin(currentRotationY);
      const cosX = Math.cos(currentRotationX);
      const sinX = Math.sin(currentRotationX);

      const focalLength = 480;
      const projected: { px: number; py: number; pz: number; scale: number; node: MolecularNode }[] = [];

      // Rotate and project points
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Rotate Y
        let x1 = n.baseX * cosY - n.baseZ * sinY;
        let z1 = n.baseZ * cosY + n.baseX * sinY;

        // Rotate X
        let y2 = n.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + n.baseY * sinX;

        const scale = focalLength / (focalLength + z2 + 180);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        projected.push({ px, py, pz: z2, scale, node: n });
      }

      // Sort by depth (painter's algorithm)
      projected.sort((a, b) => a.pz - b.pz);

      // 1. Draw connecting molecular bond lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];

          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect nodes that are close in 2D and 3D space
          if (dist < 115) {
            const alpha = Math.max(0, (1 - dist / 115) * 0.18 * ((p1.scale + p2.scale) / 2));
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // 2. Draw orbital rings
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(currentRotationY * 0.6);

      // Orbital ellipse 1
      ctx.beginPath();
      ctx.ellipse(0, 0, 160, 60, Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 217, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      // Orbital ellipse 2
      ctx.beginPath();
      ctx.ellipse(0, 0, 220, 80, -Math.PI / 3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139, 92, 246, 0.04)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 8]);
      ctx.stroke();

      ctx.restore();

      // 3. Draw nodes with glowing corona
      for (let i = 0; i < projected.length; i++) {
        const { px, py, scale, node } = projected[i];
        const r = Math.max(1.2, node.radius * scale);
        const nodeAlpha = Math.min(0.85, Math.max(0.15, (scale - 0.5) * 1.5));

        // Outer glow
        const nodeGlow = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
        nodeGlow.addColorStop(0, node.color);
        nodeGlow.addColorStop(1, "rgba(5, 6, 8, 0)");
        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(px, py, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Solid core
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Sequence Milestones
  // Phase 1: 0.0s - 1.0s (Canvas node awakens)
  // Phase 2: 1.0s - 2.0s (Header logo & author badge)
  // Phase 3: 2.0s - 4.0s (Hero statement & description)
  // Phase 4: 4.0s - 5.5s (4 capability indicators)
  // Phase 5: 5.5s - 7.0s (Progress bar & ready state)
  const isPhase2 = elapsed >= 1000;
  const isPhase3 = elapsed >= 2000;
  const isPhase4 = elapsed >= 4000;
  const isPhase5 = elapsed >= 5500;

  // Smooth progress calculation (0 to 100%) across 7.0s
  const progressPercent = Math.min(100, Math.max(0, (elapsed / TOTAL_DURATION) * 100));
  const remainingSeconds = Math.max(0, Math.ceil((TOTAL_DURATION - elapsed) / 1000));

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#050608] text-[#F5F7FA] flex flex-col justify-between items-center px-4 sm:px-8 py-4 sm:py-5 overflow-hidden select-none selection:bg-cyan-500/20 selection:text-cyan-200 transition-all duration-700 ease-out ${
        isExiting ? "opacity-0 scale-[1.02] blur-md pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ backgroundColor: "#050608" }}
    >
      {/* 3D Canvas Molecular Orbital Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none w-full h-full"
      />

      {/* Subtle Depth Vignette & Hairline Noise */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1] opacity-40 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,6,8,0.7)_80%,#050608_100%)]" 
      />

      {/* ============================================================ */}
      {/* TOP NAVIGATION: Minimalist Precision Header                  */}
      {/* ============================================================ */}
      <header 
        className={`relative z-10 w-full flex items-center justify-between px-2 sm:px-6 pb-3 border-b border-white/[0.06] shrink-0 transition-all duration-1000 ease-out ${
          isPhase2 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
      >
        {/* Far Left: PIECHEM Refined Logo */}
        <div className="flex items-center gap-3">
          <PiechemLogo size="md" subtitle="Learning Platform" />
        </div>

        {/* Far Right: Ultra-clean Status Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md text-[10px] sm:text-xs font-mono tracking-widest text-slate-300 shadow-[0_0_15px_rgba(0,217,255,0.08)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-[0_0_8px_#00D9FF] animate-pulse" />
          <span className="text-white/40 hidden sm:inline">SYSTEM ONLINE</span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-cyan-300/90 font-medium">SMART LEARNING PLATFORM</span>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN HERO: Cinematic Centerpiece                             */}
      {/* ============================================================ */}
      <main className="relative z-10 w-full max-w-2xl my-auto py-2 flex flex-col items-center justify-center text-center shrink-0 space-y-4 sm:space-y-5">
        
        {/* Initiative Badge (Phase 2) */}
        <div 
          className={`transition-all duration-700 ease-out ${
            isPhase2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.025] border border-cyan-500/25 text-cyan-300/90 text-[10.5px] sm:text-xs tracking-[0.14em] font-mono uppercase backdrop-blur-md shadow-[0_0_20px_rgba(0,217,255,0.12)]">
            <span className="w-1 h-1 rounded-full bg-[#00D9FF] shadow-[0_0_6px_#00D9FF]" />
            <span>AN INITIATIVE BY <strong className="text-white font-semibold tracking-wider">ARGHYADEEP ROY</strong></span>
          </div>
        </div>

        {/* Main Title: "Chemistry, Visualized." (Phase 3) */}
        <div 
          className={`space-y-2 transition-all duration-1000 ease-out ${
            isPhase3 ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-4 blur-sm"
          }`}
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extralight tracking-tight text-white leading-[1.08]">
            <span className="font-serif italic font-normal text-slate-100 drop-shadow-[0_2px_20px_rgba(255,255,255,0.15)]">
              Chemistry,
            </span>{" "}
            <span className="font-sans font-bold bg-gradient-to-r from-white via-cyan-100 to-[#00D9FF] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,217,255,0.35)]">
              Visualized.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 font-light tracking-wide max-w-xl mx-auto pt-1">
            Interactive learning for{" "}
            <span className="text-[#00D9FF] font-medium">JEE</span>,{" "}
            <span className="text-amber-300 font-medium">NEET</span> &{" "}
            <span className="text-emerald-300 font-medium">Boards</span>.
          </p>

          <p className="text-xs sm:text-sm text-slate-400/90 max-w-lg mx-auto leading-relaxed font-light">
            Explore molecules in 3D, master concepts through curated notes, practice with DPPs, and challenge yourself with AI-powered tests.
          </p>
        </div>

        {/* ============================================================ */}
        {/* CAPABILITIES: 4 Refined Scientific Indicators (Phase 4)      */}
        {/* ============================================================ */}
        <div 
          className={`w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-1 transition-all duration-700 ease-out ${
            isPhase4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          {/* 1. 3D Molecular Labs */}
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-white/[0.08] hover:border-cyan-500/40 backdrop-blur-md transition-colors group">
            <Atom className="w-3.5 h-3.5 text-[#00D9FF] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] sm:text-[11px] font-mono tracking-wider text-slate-200 uppercase whitespace-nowrap">
              3D Labs
            </span>
          </div>

          {/* 2. Smart Notes */}
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-white/[0.08] hover:border-amber-400/40 backdrop-blur-md transition-colors group">
            <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] sm:text-[11px] font-mono tracking-wider text-slate-200 uppercase whitespace-nowrap">
              Smart Notes
            </span>
          </div>

          {/* 3. NTA Test Engine */}
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-white/[0.08] hover:border-emerald-400/40 backdrop-blur-md transition-colors group">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] sm:text-[11px] font-mono tracking-wider text-slate-200 uppercase whitespace-nowrap">
              NTA Engine
            </span>
          </div>

          {/* 4. AI Chem Tutor */}
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.025] border border-white/[0.08] hover:border-purple-400/40 backdrop-blur-md transition-colors group">
            <Sparkles className="w-3.5 h-3.5 text-purple-300 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] sm:text-[11px] font-mono tracking-wider text-slate-200 uppercase whitespace-nowrap">
              AI Tutor
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TRANSITION & PREPARATION ENGINE (Phase 5: 5.5s - 7.0s)       */}
        {/* ============================================================ */}
        <div 
          className={`w-full max-w-md pt-2 space-y-2 transition-all duration-700 ease-out ${
            isPhase3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          {/* Subtle preparation label & status */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-wider text-slate-400 px-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-ping" />
              {isPhase5 ? "ENTERING PIECHEM PORTAL" : "PREPARING LEARNING ENVIRONMENT"}
            </span>

            <span className="text-cyan-300/80">
              {isPaused ? "PAUSED" : `${String(remainingSeconds).padStart(2, '0')}s`}
            </span>
          </div>

          {/* Synchronized Precision Hairline Progress Bar */}
          <div className="relative w-full h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
            <div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#248BFF] via-[#00D9FF] to-[#8B5CF6] transition-all duration-100 ease-linear shadow-[0_0_12px_#00D9FF]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Action Row: Pause/Play & Enter Now Bypass */}
          <div className="flex items-center justify-between pt-1 text-[10.5px] font-mono">
            <button
              type="button"
              onClick={togglePause}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.06]"
              title={isPaused ? "Resume loading" : "Pause loading"}
            >
              {isPaused ? (
                <>
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>RESUME</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 text-slate-400" />
                  <span>PAUSE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleEnterNow}
              className="group inline-flex items-center gap-1 text-cyan-300 hover:text-white transition-colors px-2.5 py-0.5 rounded bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 shadow-sm"
            >
              <span>ENTER PORTAL</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 text-[#00D9FF]" />
            </button>
          </div>
        </div>

      </main>

      {/* ============================================================ */}
      {/* MINIMAL FOOTER: Direct Scientific Touch                     */}
      {/* ============================================================ */}
      <footer 
        className={`relative z-10 w-full flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 gap-1 px-2 sm:px-6 pt-2 border-t border-white/[0.06] shrink-0 transition-all duration-1000 ease-out ${
          isPhase2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="flex items-center gap-3">
          <span>PIECHEM CHEMISTRY ARCHIVES</span>
          <span>•</span>
          <span className="text-slate-400">PRECISION + SCIENCE + TECHNOLOGY</span>
        </div>
        <span>© {new Date().getFullYear()} PIECHEM • ALL RIGHTS RESERVED</span>
      </footer>
    </div>
  );
}
