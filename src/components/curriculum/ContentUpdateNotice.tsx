"use client";

import React, { useState } from "react";
import { Sparkles, Bell, X, Compass } from "lucide-react";

interface ContentUpdateNoticeProps {
  className?: string;
  variant?: "cyan" | "amber" | "emerald" | "rose" | "purple" | "default";
}

export default function ContentUpdateNotice({
  className = "",
  variant = "cyan"
}: ContentUpdateNoticeProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const colorStyles = {
    cyan: {
      border: "border-cyan-500/30 hover:border-cyan-500/50",
      bg: "bg-gradient-to-r from-cyan-950/40 via-cyan-900/15 to-transparent",
      badgeBg: "bg-cyan-500/15 border-cyan-400/40 text-cyan-300",
      accent: "text-cyan-400",
      glow: "shadow-[0_0_25px_rgba(0,217,255,0.08)]"
    },
    amber: {
      border: "border-amber-500/30 hover:border-amber-500/50",
      bg: "bg-gradient-to-r from-amber-950/40 via-amber-900/15 to-transparent",
      badgeBg: "bg-amber-500/15 border-amber-400/40 text-amber-300",
      accent: "text-amber-400",
      glow: "shadow-[0_0_25px_rgba(245,158,11,0.08)]"
    },
    emerald: {
      border: "border-emerald-500/30 hover:border-emerald-500/50",
      bg: "bg-gradient-to-r from-emerald-950/40 via-emerald-900/15 to-transparent",
      badgeBg: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300",
      accent: "text-emerald-400",
      glow: "shadow-[0_0_25px_rgba(16,185,129,0.08)]"
    },
    rose: {
      border: "border-rose-500/30 hover:border-rose-500/50",
      bg: "bg-gradient-to-r from-rose-950/40 via-rose-900/15 to-transparent",
      badgeBg: "bg-rose-500/15 border-rose-400/40 text-rose-300",
      accent: "text-rose-400",
      glow: "shadow-[0_0_25px_rgba(244,63,94,0.08)]"
    },
    purple: {
      border: "border-purple-500/30 hover:border-purple-500/50",
      bg: "bg-gradient-to-r from-purple-950/40 via-purple-900/15 to-transparent",
      badgeBg: "bg-purple-500/15 border-purple-400/40 text-purple-300",
      accent: "text-purple-400",
      glow: "shadow-[0_0_25px_rgba(168,85,247,0.08)]"
    },
    default: {
      border: "border-cyan-500/30 hover:border-cyan-500/50",
      bg: "bg-gradient-to-r from-cyan-950/40 via-cyan-900/15 to-transparent",
      badgeBg: "bg-cyan-500/15 border-cyan-400/40 text-cyan-300",
      accent: "text-cyan-400",
      glow: "shadow-[0_0_25px_rgba(0,217,255,0.08)]"
    }
  };

  const style = colorStyles[variant] || colorStyles.default;

  return (
    <div
      role="region"
      aria-label="Content updates notification"
      className={`w-full relative overflow-hidden rounded-2xl border ${style.border} ${style.bg} ${style.glow} p-4 sm:p-5 backdrop-blur-md transition-all duration-300 ${className}`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Pulsing indicator icon */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-300">
            <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${style.accent}`} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${variant === 'rose' ? 'bg-rose-400' : variant === 'emerald' ? 'bg-emerald-400' : variant === 'amber' ? 'bg-amber-400' : 'bg-cyan-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${variant === 'rose' ? 'bg-rose-500' : variant === 'emerald' ? 'bg-emerald-500' : variant === 'amber' ? 'bg-amber-500' : 'bg-cyan-500'}`}></span>
          </span>
        </div>

        {/* Text body */}
        <div className="flex-1 min-w-0 pr-6 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider border ${style.badgeBg}`}>
              Daily Content Updates
            </span>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Continuous Repository Expansion
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200/95 leading-relaxed pt-1">
            We are uploading and refining new study materials every day. If your desired chapter or topic is not yet published, please bear with us as our academic faculty actively uploads notes, DPPs, and question banks. In the meantime, kindly explore all currently available and recently uploaded resources.
          </p>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
