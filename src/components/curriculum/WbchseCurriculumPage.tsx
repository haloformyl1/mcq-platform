"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  BookOpen, 
   
  Award, 
  Layers, 
  Sparkles, 
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
  Globe2,
  Calendar,
  Zap
} from "lucide-react";
import { 
  StudyMaterialItem, 
  RESOURCE_CATEGORIES, 
  filterMaterialsForContext 
} from "./curriculumData";

interface WbchseCurriculumPageProps {
  materials: StudyMaterialItem[];
  student?: any;
  basePath?: string;
}

export default function WbchseCurriculumPage({
  materials,
  student,
  basePath = "/study-material"
}: WbchseCurriculumPageProps) {
  const sem1Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_1"), [materials]);
  const sem2Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_2"), [materials]);
  const sem3Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_3"), [materials]);
  const sem4Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_4"), [materials]);

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-200">

      {/* STEP 2: The 4-Semester Interactive System Grid */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div>
          <h2 className="text-xs font-mono tracking-[0.2em] text-emerald-400 uppercase">
            Select Academic Semester
          </h2>
          <p className="text-2xl font-bold text-white mt-1">
            WBCHSE 4-Semester Portals
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Semester I */}
          <Link
            href="/study-material/wbchse/sem-1"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                  CLASS 11 · TERM 1
                </span>
                <span className="text-xs font-mono text-emerald-400/80">
                  {sem1Materials.length} Docs
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  Semester I
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  Basic concepts of chemistry, atomic structure, periodic table trends, and chemical bonding MCQ foundations.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/20 text-emerald-300">
                  MCQ & Objective Focus
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Open Semester I</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Semester II */}
          <Link
            href="/study-material/wbchse/sem-2"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                  CLASS 11 · TERM 2
                </span>
                <span className="text-xs font-mono text-emerald-400/80">
                  {sem2Materials.length} Docs
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  Semester II
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  Thermodynamics, chemical equilibrium, redox processes, hydrogen, s-block elements, and basic organic principles.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/20 text-emerald-300">
                  Descriptive & Numericals
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Open Semester II</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Semester III */}
          <Link
            href="/study-material/wbchse/sem-3"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                  CLASS 12 · TERM 1
                </span>
                <span className="text-xs font-mono text-emerald-400/80">
                  {sem3Materials.length} Docs
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  Semester III
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  Solid state, solutions, electrochemistry, surface chemistry, and d- and f-block transition elements.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/20 text-emerald-300">
                  Advanced Physical & MCQ
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Open Semester III</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Semester IV */}
          <Link
            href="/study-material/wbchse/sem-4"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                  CLASS 12 · TERM 2
                </span>
                <span className="text-xs font-mono text-emerald-400/80">
                  {sem4Materials.length} Docs
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  Semester IV
                </h3>
                <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                  Coordination chemistry, haloalkanes, carbonyl compounds, amines, biomolecules, and final WBCHSE Board + WBJEE preparation.
                </p>
              </div>

              <div className="pt-2">
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/20 text-emerald-300">
                  Board Final + WBJEE Bridge
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Open Semester IV</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

        </div>
      </div>

          </div>
  );
}