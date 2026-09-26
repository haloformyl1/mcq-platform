"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  FileCheck, 
  Award, 
  Layers, 
   
  FileText, 
  Flame, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  Eye, 
  Download, 
  Lock, 
  Sparkle, 
  Check, 
  GraduationCap,
  Target,
  Trophy,
  Zap
} from "lucide-react";
import { 
  StudyMaterialItem, 
  RESOURCE_CATEGORIES, 
  filterMaterialsForContext 
} from "./curriculumData";

interface EntranceCurriculumPageProps {
  materials: StudyMaterialItem[];
  student?: any;
  basePath?: string;
}

export default function EntranceCurriculumPage({
  materials,
  student,
  basePath = "/study-material"
}: EntranceCurriculumPageProps) {
  return (
    <div className="w-full text-slate-100 font-sans selection:bg-rose-500/20 selection:text-rose-200">

      {/* Hero Banner: Entrance Radiant Rose Theme */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#24040d] via-[#330814] to-[#120106] border border-rose-500/30 p-8 sm:p-12 shadow-[0_20px_60px_rgba(244,63,94,0.12)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#F43F5E] animate-pulse" />
              <span>COMPETITIVE ENTRANCE • ALL-INDIA ARCHIVES</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-serif italic">
              Competitive Chemistry Rank Accelerator
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-2xl">
              34-Year chapter-wise solved PYQ archives, high-yield DPP drill banks, NCERT booster formula digests, speed drills, and national mock papers for NEET, JEE, WBJEE & CUET.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-rose-400" />
                <span>34-Year Solved PYQs</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>High-Yield DPP Drills</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-400" />
                <span>NCERT Formula Boosters</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: The 4 Exam Stream Portals */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div>
          <h2 className="text-xs font-mono tracking-[0.2em] text-rose-400 uppercase">
            Choose Target Examination
          </h2>
          <p className="text-2xl font-bold text-white mt-1">
            Competitive Examination Tracks
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* NEET UG */}
          <Link
            href="/study-material/entrance/neet"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-rose-950/30 hover:to-white/[0.03] border border-rose-500/20 hover:border-rose-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(244,63,94,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-rose-300 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30">
                  MEDICAL ENTRANCE
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#F43F5E]" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-rose-300 transition-colors">
                  NEET UG
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  100% NCERT line-by-line master drills, organic reaction charts, and 34-year solved medical entrance PYQs.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/50 border border-rose-500/20 text-rose-300">
                  NCERT Master Drills & PYQs
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-rose-400">
              <span>Enter NEET Vault</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* JEE Mains & Adv */}
          <Link
            href="/study-material/entrance/jee"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-rose-950/30 hover:to-white/[0.03] border border-blue-500/20 hover:border-blue-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(59,130,246,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-blue-300 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30">
                  ENGINEERING ENTRANCE
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3B82F6]" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-blue-300 transition-colors">
                  JEE Mains & Adv.
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  Rigorous physical chemistry problem sets, multi-concept organic synthesis, and coordination numericals.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/50 border border-blue-500/20 text-blue-300">
                  Multi-Concept Numericals
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-blue-400">
              <span>Enter JEE Vault</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* WBJEE Target */}
          <Link
            href="/study-material/entrance/wbjee"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-rose-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                  STATE ENGINEERING
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  WBJEE Target
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  Category I, II & III targeted practice, speed calculation tricks, and 20-year solved WBJEE papers.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/20 text-emerald-300">
                  Speed Tests & Category Drills
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Enter WBJEE Vault</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* CUET & Others */}
          <Link
            href="/study-material/entrance/cuet"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-rose-950/30 hover:to-white/[0.03] border border-amber-500/20 hover:border-amber-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(245,158,11,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30">
                  CENTRAL UNIVERSITIES
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  CUET & Others
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  Central university entrance papers, state entrance sets, and complete formula bibles.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/20 text-amber-300">
                  Objective Pattern Mastery
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Enter CUET Vault</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

        </div>
      </div>

          </div>
  );
}