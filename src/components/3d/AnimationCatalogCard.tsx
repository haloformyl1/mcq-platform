"use client";

import React from "react";
import Link from "next/link";
import { Play, Sparkles, Check, Lock, Box, ArrowRight, ShieldAlert } from "lucide-react";
import { isStudentEligibleForMaterial } from "@/lib/studyMaterialMetadata";

interface AnimationCatalogCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    isPremium: boolean;
    isLocked?: boolean;
    isLevelRestricted?: boolean;
    restrictionReason?: string;
    badgeLabel?: string;
    buttonLabel?: string;
    targetLabel?: string;
    policyTitle?: string;
    policyNote?: string;
    section?: string;
    classSem?: string;
    discipline?: string;
    category?: string;
    url?: string;
  };
  isGold?: boolean;
  isGoldMember?: boolean;
  student?: any;
  onLockedClick: (item: any) => void;
  featured?: boolean;
}

export default function AnimationCatalogCard({
  item,
  isGold,
  isGoldMember,
  student,
  onLockedClick,
  featured = false
}: AnimationCatalogCardProps) {
  const hasGold = Boolean(isGold ?? isGoldMember);
  const eligibility = isStudentEligibleForMaterial(student, item.section, item.classSem);
  const isLevelRestricted = student ? !eligibility.eligible : Boolean(item.isLevelRestricted);
  const restrictionReason = eligibility.reason || item.restrictionReason;
  const badgeLabel = eligibility.badgeLabel || item.badgeLabel || (item.classSem === 'ALL' ? (item.section || 'RESTRICTED') : `${item.classSem} ONLY`);
  const buttonLabel = eligibility.buttonLabel || item.buttonLabel || `Restricted (${item.classSem === 'ALL' ? (item.section || 'Curriculum') : item.classSem})`;
  const targetLabel = eligibility.targetLabel || item.targetLabel;
  const policyTitle = eligibility.policyTitle || item.policyTitle;
  const policyNote = eligibility.policyNote || item.policyNote;
  const canAccess = !isLevelRestricted && (!item.isPremium || hasGold);
  const cleanTitle = item.title.replace(/\(.*?\)/g, "").trim();

  // Determine scientific theme based on title / discipline
  const lowerTitle = item.title.toLowerCase();
  const isSolidState = lowerTitle.includes("solid") || lowerTitle.includes("lattice") || lowerTitle.includes("void");
  const isBonding = lowerTitle.includes("bond") || lowerTitle.includes("orbital") || lowerTitle.includes("hybrid");

  // Academic level & category resolution
  const disciplineLabel = item.discipline || (isSolidState ? "PHYSICAL" : isBonding ? "INORGANIC" : "GENERAL");
  const academicLevel = isSolidState ? "Class 12 • Solid State" : isBonding ? "Class 11 • Chemical Bonding" : "Class 11/12 | JEE | NEET";

  return (
    <article 
      className={`group relative rounded-2xl overflow-hidden flex flex-col justify-between
        bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm
        border transition-all duration-300 ease-out
        ${item.isPremium 
            ? "border-amber-500/25 hover:border-amber-400/60 hover:shadow-[0_16px_40px_rgba(245,158,11,0.12)]" 
            : "border-sky-500/20 hover:border-sky-400/60 hover:shadow-[0_16px_40px_rgba(0,217,255,0.15)]"
        }
        hover:-translate-y-1.5 cursor-pointer`}
    >
      {/* Linear top accent shimmer line */}
      <div 
        className={`absolute top-0 inset-x-0 h-[1px] transition-opacity duration-300
          ${item.isPremium ? "bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" : "bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"}
          opacity-0 group-hover:opacity-100`}
      />

      {/* ========================================================= */}
      {/* A. LARGE VISUAL PREVIEW AREA (55-60% of top card)         */}
      {/* ========================================================= */}
      <div className="relative w-full h-48 sm:h-52 bg-gradient-to-b from-[#050e1c] to-[#00070d] overflow-hidden flex items-center justify-center">
        
        {/* Atmospheric Radial Glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${item.isPremium ? "rgba(245, 158, 11, 0.15)" : "rgba(0, 217, 255, 0.16)"} 0%, transparent 70%)`
          }}
        />

        {/* Scientific Grid / Coordinate Plane Texture */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(56, 189, 248, 0.6) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />

        {/* Interactive 3D Chemistry Structure Illustration */}
        <div className="relative z-10 flex items-center justify-center w-full h-full transition-transform duration-500 group-hover:scale-105">
          {isSolidState ? (
            /* Solid State Crystal Lattice (FCC/BCC Isometric Illustration) */
            <svg viewBox="0 0 200 160" className="w-48 h-40 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]" fill="none">
              {/* Isometric Cube framework */}
              <path d="M100 20 L160 50 L160 110 L100 140 L40 110 L40 50 Z" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M100 20 L100 80 L160 110" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1.5" />
              <path d="M100 80 L40 110" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1.5" />
              
              {/* Isometric Diagram Coordinate Grid */}
              <path d="M50 65 L150 115" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="2 2" />
              <path d="M150 65 L50 115" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="2 2" />

              {/* Corner Atoms (Vertices) - Gleaming Turquoise/Cyan */}
              <circle cx="100" cy="20" r="7" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />
              <circle cx="160" cy="50" r="7" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />
              <circle cx="160" cy="110" r="7" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />
              <circle cx="100" cy="140" r="7" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />
              <circle cx="40" cy="110" r="7" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />
              <circle cx="40" cy="50" r="7" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />

              {/* Central Body / Face-Center Atom (Gold Accent) */}
              <circle cx="100" cy="80" r="9" fill="url(#goldAtom)" stroke="#fff275" strokeWidth="2" />

              <defs>
                <linearGradient id="goldAtom" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
          ) : isBonding ? (
            /* Chemical Bonding / VSEPR Orbitals & Hybridization */
            <svg viewBox="0 0 200 160" className="w-48 h-40 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]" fill="none">
              {/* Orbital electron dashed clouds */}
              <ellipse cx="100" cy="80" rx="55" ry="22" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.5" strokeDasharray="6 4" transform="rotate(-30 100 80)" />
              <ellipse cx="100" cy="80" rx="55" ry="22" stroke="rgba(251, 191, 36, 0.45)" strokeWidth="1.5" strokeDasharray="6 4" transform="rotate(30 100 80)" />

              {/* Sigma & Pi Bond Covalent Links */}
              <line x1="100" y1="80" x2="50" y2="40" stroke="#00f2fe" strokeWidth="2.5" />
              <line x1="100" y1="80" x2="150" y2="40" stroke="#00f2fe" strokeWidth="2.5" />
              <line x1="100" y1="80" x2="100" y2="135" stroke="#fbbf24" strokeWidth="2.5" />

              {/* Terminal Ligand Atoms */}
              <circle cx="50" cy="40" r="6.5" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />
              <circle cx="150" cy="40" r="6.5" fill="#00f2fe" stroke="#fff" strokeWidth="1.5" />
              <circle cx="100" cy="135" r="6.5" fill="#fbbf24" stroke="#fff" strokeWidth="1.5" />

              {/* Central Hybridized Carbon/Nucleus */}
              <circle cx="100" cy="80" r="11" fill="#ff9275" stroke="#ffffff" strokeWidth="2" />
            </svg>
          ) : (
            /* Atomic Spatial Model / Quantum Orbitals */
            <svg viewBox="0 0 200 160" className="w-48 h-40 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]" fill="none">
              <ellipse cx="100" cy="80" rx="60" ry="20" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="1.5" transform="rotate(45 100 80)" />
              <ellipse cx="100" cy="80" rx="60" ry="20" stroke="rgba(129, 140, 248, 0.5)" strokeWidth="1.5" transform="rotate(-45 100 80)" />
              <circle cx="100" cy="80" r="8" fill="#00f2fe" stroke="#ffffff" strokeWidth="2" />
            </svg>
          )}
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between gap-2">
          
          {isLevelRestricted && (
            <span 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(244,63,94,0.25)]"
              title={restrictionReason}
            >
              <Lock className="w-3 h-3 text-rose-300 shrink-0" />
              <span>{badgeLabel}</span>
            </span>
          )}

          {/* Admin-Driven FREE vs PREMIUM Badge */}
          {item.isPremium ? (
            <span 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-600/25 border border-amber-400/50 text-amber-300 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              aria-label="Premium Content"
            >
              <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
              <span>✦ PREMIUM</span>
            </span>
          ) : (
            <span 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-emerald-600/20 border border-cyan-400/40 text-cyan-300 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(0,242,254,0.15)]"
              aria-label="Free Content"
            >
              <Check className="w-3 h-3 text-cyan-300 shrink-0" />
              <span>✓ FREE</span>
            </span>
          )}

          {/* Discipline / Category Pill */}
          <span className="px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase bg-slate-950/80 border border-slate-700/60 text-slate-300">
            {disciplineLabel}
          </span>
        </div>

        {/* Bottom Status Pill in Preview */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>WebGL 3D Spatial Engine</span>
          </span>

          {featured && (
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
              FEATURED LAB
            </span>
          )}
        </div>

        {/* Vignette Gradient Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#02070c] via-transparent to-transparent" />
      </div>

      {/* ========================================================= */}
      {/* B. INFORMATION & ACADEMIC METADATA SECTION                */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-sky-400/90">
              {item.category === "3D animations" ? "3D EXPERIENCE" : item.category || "3D EXPERIENCE"}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-sky-200 transition-colors line-clamp-2 leading-snug">
            {cleanTitle}
          </h3>

          <p className="text-xs text-slate-300/90 font-normal leading-relaxed line-clamp-2">
            {item.description || "Explore interactive 3D simulations of chemical structures and reaction mechanics."}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800">
              {academicLevel}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900/70 border border-slate-800">
              3D Controls
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* C. CTA ACTION BUTTON                                      */}
        {/* ========================================================= */}
        <div className="pt-3 border-t border-slate-800/70">
          {canAccess ? (
            <Link
              href={`/dashboard/lab-viewer/${item.id}`}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-[0_0_16px_rgba(56,189,248,0.3)] group/btn"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch 3D Lab</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          ) : isLevelRestricted ? (
            <button
              type="button"
              onClick={() => onLockedClick({ 
                ...item, 
                isLevelRestricted: true, 
                restrictionReason, 
                badgeLabel,
                buttonLabel,
                targetLabel,
                policyTitle,
                policyNote
              })}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/60 text-rose-300 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_14px_rgba(244,63,94,0.15)] group/btn cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>{buttonLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onLockedClick(item)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/60 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_14px_rgba(245,158,11,0.2)] group/btn"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock with Gold ✦</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
