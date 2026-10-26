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
    <div className="w-full min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center text-slate-100 font-sans selection:bg-rose-500/20 selection:text-rose-200 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* STEP 2: The 4 Exam Stream Portals */}
      <div className="w-full max-w-6xl mx-auto space-y-8 flex flex-col items-center">
        <div className="text-center">
          <h2 className="text-xs sm:text-sm font-mono tracking-[0.25em] text-rose-400 uppercase">
            Step 2: Choose Target Examination
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
          
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