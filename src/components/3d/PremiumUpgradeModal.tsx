"use client";

import React from "react";
import Link from "next/link";
import { Crown, Sparkles, X, CheckCircle2, ArrowRight, ShieldAlert, BookOpen, GraduationCap } from "lucide-react";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  animationTitle?: string;
  lockedItem?: any;
  student?: any;
}

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  animationTitle,
  lockedItem,
  student
}: PremiumUpgradeModalProps) {
  if (!isOpen) return null;

  const isRestricted = lockedItem?.isLevelRestricted;

  if (isRestricted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
        <div 
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#140b15] via-[#0f0913] to-[#060408] border border-rose-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(244,63,94,0.2)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing Rose Backdrop Accents */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-rose-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -top-24 -left-24 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6 text-center">
            {/* Shield Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500/20 to-red-500/20 border border-rose-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/40 text-rose-300">
                <span>CURRICULUM RESTRICTED</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {animationTitle || lockedItem?.title || "Curriculum Resource"}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {lockedItem?.restrictionReason || "This 3D Interactive Lab is assigned to another educational semester or class."}
              </p>
            </div>

            {/* Curriculum Scope Details */}
            <div className="bg-[#09050d] p-5 sm:p-6 rounded-2xl border border-rose-950/80 text-left space-y-3">
              <p className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                Audience Eligibility:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Assigned To:</strong> {lockedItem?.targetLabel || lockedItem?.classSem || "Designated Curriculum"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">{lockedItem?.policyTitle || "Curriculum Policy"}:</strong> {lockedItem?.policyNote || "In accordance with academic regulations, this content is mapped specifically to this cohort."}</span>
                </li>
              </ul>
            </div>

            {/* CTA Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/dashboard/account"
                className="flex-1 w-full py-3.5 px-6 rounded-xl text-sm font-black text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 transition shadow-lg shadow-rose-500/30 uppercase tracking-wider flex items-center justify-center gap-2 group"
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Switch Curriculum in Profile</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-slate-900/70 border border-slate-800 hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#091522] to-[#040a10] border border-amber-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Amber Backdrop Accents */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-24 -left-24 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6 text-center">
          {/* Crown Badge */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GOLD MEMBERSHIP EXCLUSIVE</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {animationTitle || "Premium 3D Chemistry Lab"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              This interactive WebGL 3D spatial chemistry laboratory is curated exclusively for PIE CHEM Gold members.
            </p>
          </div>

          {/* Benefits List */}
          <div className="bg-[#050e18] p-5 sm:p-6 rounded-2xl border border-slate-800/90 text-left space-y-3">
            <p className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              Unlock the Complete Learning Suite:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">All 3D Virtual Labs:</strong> Rotate crystal lattices, inspect atomic voids, visualize orbital hybridization.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Complete Chemistry Archives:</strong> Full chapter bibles, DPPs, and JEE/NEET perfection sets.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">PIECHEM AI Copilot:</strong> Unlimited deep reaction doubt solving & adaptive drills.</span>
              </li>
            </ul>
          </div>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {student ? (
              <Link
                href="/dashboard/account"
                className="flex-1 w-full py-3.5 px-6 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-lg shadow-amber-500/30 uppercase tracking-wider flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Upgrade to Gold Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(lockedItem?.id ? `/dashboard/lab-viewer/${lockedItem.id}` : '/3d-animations')}`}
                className="flex-1 w-full py-3.5 px-6 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition shadow-lg shadow-cyan-500/30 uppercase tracking-wider flex items-center justify-center gap-2 group"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Log In to Unlock Gold ✦</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3.5 px-6 rounded-xl text-sm font-bold text-slate-400 hover:text-white bg-slate-900/70 border border-slate-800 hover:bg-slate-900 transition"
            >
              Explore Free Stuff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
