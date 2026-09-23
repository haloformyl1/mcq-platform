"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { StudyMaterialItem } from "./curriculumData";

interface UpgradeModalProps {
  item: StudyMaterialItem | null;
  onClose: () => void;
}

export default function UpgradeModal({ item, onClose }: UpgradeModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full rounded-2xl bg-gradient-to-b from-[#0c1b2c] to-[#040d16] border border-amber-500/40 p-6 space-y-4 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
            PREMIUM ACADEMIC RESOURCE
          </span>
          <h3 className="text-xl font-bold text-white">
            {item.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            This chapter resource is reserved for enrolled Piechem Gold / Paid students. Upgrade your subscription or request complimentary batch access.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-slate-300 transition-colors"
          >
            Close
          </button>
          <Link
            href="/dashboard/account"
            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Request Gold Access</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
