"use client";

import { useEffect, useRef, useState } from "react";

const PI_DIGITS = "3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975";

export default function PiFiringLoader({ fullScreen = true }: { fullScreen?: boolean }) {
  const [digitCount, setDigitCount] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Continuously expand Pi digits firing stream
  useEffect(() => {
    const interval = setInterval(() => {
      setDigitCount(prev => (prev >= 120 ? 4 : prev + 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Full-Screen SN2 Reaction Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Background floating ambient particles / molecules
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      size: 2 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.35,
      label: ["Nu\u207B", "Br\u207B", "CH\u2083I", "DMSO", "Acetone", "k\u2082", "E\u2090"][Math.floor(Math.random() * 7)]
    }));

    // Floating kinetics text tickers positioned around the perimeter
    const floatingKinetics = [
      { text: "Rate = k[R-X][Nu\u207B]", x: width * 0.1, y: height * 0.16, vx: 0.2 },
      { text: "2nd Order Kinetics: Bimolecular SN2", x: width * 0.65, y: height * 0.14, vx: -0.15 },
      { text: "180\u00B0 Backside Attack Geometry", x: width * 0.08, y: height * 0.44, vx: 0.2 },
      { text: "Single-Step Concerted: No Carbocation", x: width * 0.70, y: height * 0.44, vx: -0.18 },
      { text: "Walden Inversion (100% Stereochemical Inversion)", x: width * 0.45, y: height * 0.94, vx: -0.15 },
      { text: "1/[A]\u209C - 1/[A]\u2080 = kt  |  t\u00BD = 1/(k[A]\u2080)", x: width * 0.1, y: height * 0.94, vx: 0.18 }
    ];

    const CYCLE_DURATION = 8500; // 8.5 seconds per full SN2 cycle
    let startTime: number | null = null;

    const render = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const t = (elapsed % CYCLE_DURATION) / CYCLE_DURATION; // 0.0 to 1.0

      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 1. SUBTLE GRID LINES
      // -------------------------------------------------------------
      ctx.strokeStyle = "rgba(0, 180, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 2. AMBIENT PARTICLES
      // -------------------------------------------------------------
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "10px monospace";
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha * 0.4})`;
        ctx.fillText(p.label, p.x + 6, p.y + 3);
      });

      // -------------------------------------------------------------
      // 3. FLOATING KINETIC FORMULA CALLOUTS
      // -------------------------------------------------------------
      floatingKinetics.forEach(item => {
        item.x += item.vx;
        if (item.x > width * 0.85) item.vx = -Math.abs(item.vx);
        if (item.x < width * 0.05) item.vx = Math.abs(item.vx);

        ctx.font = "11px monospace";
        ctx.fillStyle = "rgba(0, 229, 255, 0.35)";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 6;
        ctx.fillText(item.text, item.x, item.y);
        ctx.shadowBlur = 0;
      });

      // -------------------------------------------------------------
      // 4. POTENTIAL ENERGY PROFILE (BOTTOM-LEFT CORNER)
      // -------------------------------------------------------------
      const peX = Math.max(30, width * 0.06);
      const peY = height * 0.86;
      const peW = Math.min(width * 0.28, 320);
      const peH = 75;

      ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(peX, peY);
      ctx.lineTo(peX + peW, peY);
      ctx.moveTo(peX, peY);
      ctx.lineTo(peX, peY - peH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.fillText("Energy (Ep)", peX - 5, peY - peH - 6);
      ctx.fillText("Reaction Coord. \u25BA", peX + peW - 85, peY + 14);

      // Single-hump Concerted SN2 Activation Curve
      ctx.strokeStyle = "rgba(0, 229, 255, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const startY = peY - 20;
      const peakY = peY - peH + 10;
      const endY = peY - 10;
      ctx.moveTo(peX, startY);
      ctx.bezierCurveTo(
        peX + peW * 0.35, startY,
        peX + peW * 0.42, peakY,
        peX + peW * 0.5, peakY
      );
      ctx.bezierCurveTo(
        peX + peW * 0.58, peakY,
        peX + peW * 0.65, endY,
        peX + peW, endY
      );
      ctx.stroke();

      // Live synchronized bead on Energy Curve
      const beadX = peX + peW * Math.min(Math.max(t, 0.05), 0.95);
      let beadY: number;
      if (t < 0.5) {
        const u = t / 0.5;
        beadY = startY + (peakY - startY) * Math.sin((u * Math.PI) / 2);
      } else {
        const u = (t - 0.5) / 0.5;
        beadY = peakY + (endY - peakY) * (1 - Math.cos((u * Math.PI) / 2));
      }

      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(beadX, beadY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(245, 158, 11, 0.7)";
      ctx.fillText("TS\u2021", peX + peW * 0.5 - 8, peakY - 8);

      // -------------------------------------------------------------
      // 5. MAIN SN2 REACTION MOLECULAR SIMULATION
      // ELEVATED TO UPPER-CENTER (ABOVE PI CALCULATOR) TO PREVENT OVERLAP
      // -------------------------------------------------------------
      const cx = width * 0.5;
      const cy = Math.max(130, height * 0.23); // Elevated above Pi core!

      const scale = Math.min(width / 1300, 1.05);
      const baseBondLen = 78 * scale;
      const atomC_radius = 20 * scale;
      const atomNu_radius = 18 * scale;
      const atomX_radius = 20 * scale;
      const atomH_radius = 11 * scale;

      let nuX: number;
      let xPos: number;
      let umbrellaAngle: number;
      let tsAlpha = 0;
      let reactionStatusText = "";
      let statusColor = "#38bdf8";

      if (t <= 0.35) {
        // PHASE 1: BACKSIDE ATTACK APPROACH
        const p = t / 0.35;
        nuX = cx - (440 * scale - p * (300 * scale));
        xPos = cx + baseBondLen;
        umbrellaAngle = 0.52; // tilted right
        reactionStatusText = "PHASE 1: 180\u00B0 BACKSIDE ATTACK (CONCERTED COLLISION)";
        statusColor = "#38bdf8";
      } else if (t <= 0.60) {
        // PHASE 2: PENTACOORDINATE TRANSITION STATE
        const p = (t - 0.35) / 0.25;
        const entryNu = cx - 140 * scale;
        const tsNu = cx - 110 * scale;
        nuX = entryNu + p * (tsNu - entryNu);

        const entryX = cx + baseBondLen;
        const tsX = cx + 110 * scale;
        xPos = entryX + p * (tsX - entryX);

        umbrellaAngle = 0.52 * (1 - p); // flattens to 0 (planar)
        tsAlpha = Math.sin(p * Math.PI);
        reactionStatusText = "PHASE 2: [Nu\u00B7\u00B7\u00B7C\u00B7\u00B7\u00B7X]\u2021 PENTACOORDINATE TRANSITION STATE";
        statusColor = "#f59e0b";
      } else if (t <= 0.85) {
        // PHASE 3: WALDEN INVERSION & LEAVING GROUP EXPULSION
        const p = (t - 0.60) / 0.25;
        nuX = cx - 110 * scale + p * (30 * scale); // contracts to solid bond at -80 * scale

        const tsX = cx + 110 * scale;
        xPos = tsX + Math.pow(p, 1.3) * (340 * scale);

        umbrellaAngle = -0.52 * Math.sin((p * Math.PI) / 2); // flips to -0.52 (inverted!)
        reactionStatusText = "PHASE 3: WALDEN INVERSION (100% STEREOCHEMICAL INVERSION)";
        statusColor = "#10b981";
      } else {
        // PHASE 4: PRODUCT FORMED & RESET
        const p = (t - 0.85) / 0.15;
        nuX = cx - 80 * scale;
        xPos = cx + 450 * scale + p * (100 * scale);
        umbrellaAngle = -0.52;
        reactionStatusText = "PHASE 4: INVERTED PRODUCT FORMED + EXPELLED LEAVING GROUP";
        statusColor = "#a855f7";
      }

      // Draw Top Status Banner (cleanly above the reaction)
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = statusColor;
      ctx.shadowColor = statusColor;
      ctx.shadowBlur = 10;
      ctx.textAlign = "center";
      ctx.fillText(reactionStatusText, cx, cy - 80 * scale);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";

      // 5A. ELECTRON PUSHING ARROWS
      if (t > 0.15 && t < 0.65) {
        ctx.strokeStyle = "rgba(0, 229, 255, 0.7)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        const arrowStartY = cy - 35 * scale;
        ctx.moveTo(nuX + 12 * scale, arrowStartY);
        ctx.quadraticCurveTo((nuX + cx) / 2, cy - 70 * scale, cx - 8 * scale, cy - 20 * scale);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#00e5ff";
        ctx.beginPath();
        ctx.arc(cx - 8 * scale, cy - 20 * scale, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(244, 63, 94, 0.7)";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx + 28 * scale, cy - 20 * scale);
        ctx.quadraticCurveTo((cx + xPos) / 2, cy - 70 * scale, xPos - 12 * scale, cy - 35 * scale);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        ctx.arc(xPos - 12 * scale, cy - 35 * scale, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5B. TRANSITION STATE BRACKETS & GLOW (ELEVATED)
      if (tsAlpha > 0.05) {
        const bW = 250 * scale;
        const bH = 155 * scale;
        const bLeft = cx - bW / 2;
        const bRight = cx + bW / 2;
        const bTop = cy - bH / 2;
        const bBottom = cy + bH / 2;

        ctx.strokeStyle = `rgba(245, 158, 11, ${tsAlpha * 0.75})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 12 * tsAlpha;

        // Left bracket [
        ctx.beginPath();
        ctx.moveTo(bLeft + 20 * scale, bTop);
        ctx.lineTo(bLeft, bTop);
        ctx.lineTo(bLeft, bBottom);
        ctx.lineTo(bLeft + 20 * scale, bBottom);
        ctx.stroke();

        // Right bracket ]
        ctx.beginPath();
        ctx.moveTo(bRight - 20 * scale, bTop);
        ctx.lineTo(bRight, bTop);
        ctx.lineTo(bRight, bBottom);
        ctx.lineTo(bRight - 20 * scale, bBottom);
        ctx.stroke();

        // Double dagger symbol ‡
        ctx.font = `bold ${20 * scale}px sans-serif`;
        ctx.fillStyle = `rgba(245, 158, 11, ${tsAlpha * 0.9})`;
        ctx.fillText("\u2021", bRight + 6 * scale, bTop + 18 * scale);
        ctx.shadowBlur = 0;

        // Radial Shockwave Ripple
        ctx.strokeStyle = `rgba(0, 229, 255, ${tsAlpha * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, (100 + tsAlpha * 40) * scale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5C. BONDS
      if (t >= 0.35) {
        ctx.lineWidth = 2.5;
        if (t <= 0.65) {
          ctx.strokeStyle = "rgba(0, 229, 255, 0.85)";
          ctx.setLineDash([5, 4]);
          ctx.shadowColor = "#00e5ff";
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = "#10b981";
          ctx.setLineDash([]);
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.moveTo(cx - atomC_radius, cy);
        ctx.lineTo(nuX + atomNu_radius, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      if (t <= 0.75) {
        ctx.lineWidth = 2.5;
        if (t < 0.35) {
          ctx.strokeStyle = "#f43f5e";
          ctx.setLineDash([]);
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = "rgba(244, 63, 94, 0.85)";
          ctx.setLineDash([5, 4]);
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 6;
        }
        ctx.beginPath();
        ctx.moveTo(cx + atomC_radius, cy);
        ctx.lineTo(xPos - atomX_radius, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      // Three Substituent Groups (Umbrella Inversion)
      const rBondLen = 65 * scale;
      const subGroups = [
        { angleY: -Math.PI / 3, zDepth: 0.8 },
        { angleY: Math.PI / 3, zDepth: 0.8 },
        { angleY: 0, zDepth: 1.15 }
      ];

      subGroups.forEach(sg => {
        const tiltX = Math.sin(umbrellaAngle) * rBondLen * sg.zDepth;
        const tiltY = Math.sin(sg.angleY) * rBondLen;

        const groupX = cx + tiltX;
        const groupY = cy + tiltY;

        ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
        ctx.lineWidth = sg.zDepth > 1 ? 4 : 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(groupX, groupY);
        ctx.stroke();

        const radGradH = ctx.createRadialGradient(
          groupX - 2, groupY - 2, 2,
          groupX, groupY, atomH_radius
        );
        radGradH.addColorStop(0, "#e0f2fe");
        radGradH.addColorStop(0.5, "#38bdf8");
        radGradH.addColorStop(1, "#0369a1");

        ctx.fillStyle = radGradH;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(groupX, groupY, atomH_radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = `bold ${8 * scale}px sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("H", groupX, groupY);
      });

      // 5D. CORE ATOMS
      // Carbon (C)
      const radGradC = ctx.createRadialGradient(
        cx - 4 * scale, cy - 4 * scale, 3,
        cx, cy, atomC_radius
      );
      radGradC.addColorStop(0, "#67e8f9");
      radGradC.addColorStop(0.5, "#06b6d4");
      radGradC.addColorStop(1, "#083344");

      ctx.fillStyle = radGradC;
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, atomC_radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `bold ${11 * scale}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("C", cx, cy);

      // Nucleophile (Nu⁻)
      const radGradNu = ctx.createRadialGradient(
        nuX - 3 * scale, cy - 3 * scale, 2,
        nuX, cy, atomNu_radius
      );
      radGradNu.addColorStop(0, "#6ee7b7");
      radGradNu.addColorStop(0.5, "#10b981");
      radGradNu.addColorStop(1, "#064e3b");

      ctx.fillStyle = radGradNu;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(nuX, cy, atomNu_radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `bold ${9 * scale}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Nu\u207B", nuX, cy);

      // Lone Pair dots
      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(nuX + atomNu_radius + 3 * scale, cy - 5 * scale, 2, 0, Math.PI * 2);
      ctx.arc(nuX + atomNu_radius + 3 * scale, cy + 5 * scale, 2, 0, Math.PI * 2);
      ctx.fill();

      // Partial charge labels (\u03B4\u207B) during TS
      if (t >= 0.35 && t <= 0.65) {
        ctx.font = `bold ${10 * scale}px sans-serif`;
        ctx.fillStyle = "#f59e0b";
        ctx.fillText("\u03B4\u207B", nuX, cy - atomNu_radius - 6 * scale);
        ctx.fillText("\u03B4\u207B", xPos, cy - atomX_radius - 6 * scale);
      }

      // Leaving Group (X)
      const radGradX = ctx.createRadialGradient(
        xPos - 4 * scale, cy - 4 * scale, 3,
        xPos, cy, atomX_radius
      );
      radGradX.addColorStop(0, "#fda4af");
      radGradX.addColorStop(0.5, "#f43f5e");
      radGradX.addColorStop(1, "#881337");

      ctx.fillStyle = radGradX;
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(xPos, cy, atomX_radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `bold ${10 * scale}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(t > 0.7 ? "X\u207B" : "X", xPos, cy);

      if (t > 0.65) {
        ctx.fillStyle = "rgba(244, 63, 94, 0.35)";
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(xPos - i * 14 * scale, cy, (atomX_radius - i * 4) * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-end bg-gradient-to-br from-[#020b12] via-[#01060a] to-[#000305] text-white overflow-hidden font-mono select-none"
    : "w-full py-16 flex flex-col items-center justify-end bg-[#071926]/80 rounded-xl border border-[#0099ff]/30 text-white overflow-hidden font-mono relative backdrop-blur-md select-none";

  return (
    <div className={containerClasses}>
      {/* ========================================================================= */}
      {/* FULL-SCREEN CANVAS: CINEMATIC SN2 REACTION MOLECULAR SIMULATION           */}
      {/* ========================================================================= */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* ========================================================================= */}
      {/* FOREGROUND: ORIGINAL PI ENERGY CORE (SEPARATED CLEANLY AT LOWER-CENTER)   */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4 mb-16 sm:mb-20 pointer-events-auto">
        
        {/* Pulsing Neon Ring with Pi symbol */}
        <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#0099ff] animate-[spin_6s_linear_infinite] opacity-60"></div>
          {/* Inner pulsing aura */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#0099ff]/30 to-[#00e5ff]/20 blur-md animate-ping opacity-40"></div>
          {/* Core Pi Badge */}
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#0a2538] to-[#02101a] border border-[#00e5ff]/60 flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.4)]">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#00e5ff] drop-shadow-[0_0_12px_#00e5ff]">
              {"\u03C0"}
            </span>
          </div>
        </div>

        {/* Firing Pi Value Stream */}
        <div className="flex flex-col items-center space-y-2 px-4 max-w-xl text-center">
          <div className="text-xs sm:text-sm font-semibold tracking-wider text-[#7dd3fc] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping"></span>
            <span className="text-[#00e5ff] font-bold">{"\u03C0"}</span> = {PI_DIGITS.slice(0, digitCount)}
            <span className="animate-pulse text-[#00e5ff]">{"\u258C"}</span>
          </div>

          {/* Particle energy beam bar */}
          <div className="w-56 sm:w-64 h-1.5 bg-[#0c2a3e] rounded-full overflow-hidden border border-[#00e5ff]/30 relative shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <div className="h-full bg-gradient-to-r from-[#0099ff] via-[#00e5ff] to-[#38bdf8] w-1/2 rounded-full animate-[piBeam_1.2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>

      {/* Global CSS animation for Pi beam */}
      <style jsx>{`
        @keyframes piBeam {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
