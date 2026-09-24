"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Crown, CheckCircle2, ArrowRight, X, ShieldAlert, GraduationCap, Lock } from "lucide-react";
import { StudyMaterialItem } from "./curriculumData";

interface UpgradeModalProps {
  item: StudyMaterialItem | any | null;
  onClose: () => void;
  student?: any;
}

export default function UpgradeModal({ item, onClose, student }: UpgradeModalProps) {
  if (!item) return null;

  const isRestricted = Boolean(item.isLevelRestricted);

  if (isRestricted) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#140b15] via-[#0f0913] to-[#060408] border border-rose-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(244,63,94,0.2)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glowing Atmospheric Accents */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full bg-rose-500/10 blur-3xl" />
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
            {/* Shield Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500/20 to-red-500/20 border border-rose-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 border border-rose-500/40 text-rose-300">
                <span>CURRICULUM RESTRICTED</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {item.title || "Curriculum Resource"}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {item.restrictionReason || "This study material is reserved for students enrolled in another semester or academic level."}
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
                  <span><strong className="text-white">Assigned To:</strong> {item.targetLabel || item.classSem || "Designated Curriculum"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">{item.policyTitle || "Curriculum Policy"}:</strong> {item.policyNote || "In accordance with academic regulations, this content is mapped specifically to this cohort."}</span>
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
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
              {item.title || "Premium Study Resource"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              This chapter master resource is reserved exclusively for enrolled PIE CHEM Gold / Paid students. Upgrade your subscription or request complimentary batch access.
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
                <span><strong className="text-white">Full Chapter Bibles & Notes:</strong> Handcrafted NCERT derivations, concept maps, and high-yield summaries.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Daily Practice Problems (DPPs):</strong> Curated numericals and advanced conceptual problem sets.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">3D Spatial Labs & AI Copilot:</strong> Interactive WebGL models and unlimited AI reaction doubt solving.</span>
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
                href={`/login?redirect=${encodeURIComponent(item?.id ? `/dashboard/pdf-viewer/${item.id.replace('db-', '')}` : '/study-material')}`}
                className="flex-1 w-full py-3.5 px-6 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-lg shadow-amber-500/30 uppercase tracking-wider flex items-center justify-center gap-2 group"
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
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
