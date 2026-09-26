"use client";

import React, { useEffect, useRef } from "react";

interface MolecularOrbitalCanvasProps {
  className?: string;
  density?: "normal" | "dense" | "subtle";
}

export default function MolecularOrbitalCanvas({
  className = "absolute inset-0 pointer-events-none",
  density = "subtle"
}: MolecularOrbitalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = false;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const startLoop = () => {
      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };

    // Pause when off-screen for maximum laptop battery and GPU efficiency
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const handleVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Generate balanced molecular nodes
    const nodeCount = density === "dense" ? 28 : density === "normal" ? 20 : 15;
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      glowColor: string;
      pulse: number;
      pulseSpeed: number;
    }> = [];

    const palette = [
      { fill: "rgba(56, 189, 248, 0.7)", glow: "rgba(56, 189, 248, 0.25)" }, // Cyan
      { fill: "rgba(45, 212, 191, 0.65)", glow: "rgba(45, 212, 191, 0.2)" }, // Teal
      { fill: "rgba(129, 140, 248, 0.6)", glow: "rgba(129, 140, 248, 0.2)" }, // Indigo
      { fill: "rgba(251, 191, 36, 0.55)", glow: "rgba(251, 191, 36, 0.15)" }  // Gold accent
    ];

    for (let i = 0; i < nodeCount; i++) {
      const p = palette[i % palette.length];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 2,
        color: p.fill,
        glowColor: p.glow,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.02
      });
    }

    // 2 Orbital Rings that slowly rotate
    let orbitalAngle1 = 0;
    let orbitalAngle2 = Math.PI / 3;

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle orbital rings centered in the canvas
      const centerX = width * 0.75;
      const centerY = height * 0.5;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Ring 1 (Tilted Cyan Orbital)
      ctx.rotate(orbitalAngle1);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.22, height * 0.32, Math.PI / 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.stroke();

      // Electron 1 (Glow halo + core)
      const e1X = Math.cos(orbitalAngle1 * 1.5) * (width * 0.22);
      const e1Y = Math.sin(orbitalAngle1 * 1.5) * (height * 0.32);
      ctx.beginPath();
      ctx.arc(e1X, e1Y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 242, 254, 0.25)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e1X, e1Y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 242, 254, 0.9)";
      ctx.fill();

      // Ring 2 (Counter-tilted Indigo/Gold Orbital)
      ctx.rotate(orbitalAngle2 - orbitalAngle1);
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.18, height * 0.26, -Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(129, 140, 248, 0.1)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      // Electron 2 (Glow halo + core)
      const e2X = Math.cos(-orbitalAngle2 * 1.2) * (width * 0.18);
      const e2Y = Math.sin(-orbitalAngle2 * 1.2) * (height * 0.26);
      ctx.beginPath();
      ctx.arc(e2X, e2Y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(e2X, e2Y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
      ctx.fill();

      ctx.restore();

      orbitalAngle1 += 0.003;
      orbitalAngle2 += 0.0025;

      // 2. Update and draw molecular nodes & lattice connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;

        // Wrap around boundaries smoothly
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;

        node.pulse += node.pulseSpeed;
        const currentRadius = node.radius + Math.sin(node.pulse) * 0.8;

        // Draw connections between nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.2;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw glowing outer halo
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = node.glowColor;
        ctx.fill();

        // Draw core node
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      }

      if (isRunning) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    startLoop();

    return () => {
      stopLoop();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ opacity: 0.85 }}
    />
  );
}
