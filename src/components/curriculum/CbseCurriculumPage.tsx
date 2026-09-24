"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
   
   
   
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
  Atom,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { 
  StudyMaterialItem, 
  RESOURCE_CATEGORIES, 
  filterMaterialsForContext 
} from "./curriculumData";

interface CbseCurriculumPageProps {
  materials: StudyMaterialItem[];
  student?: any;
  basePath?: string;
}

export default function CbseCurriculumPage({
  materials,
  student,
  basePath = "/study-material"
}: CbseCurriculumPageProps) {
  const class11Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "CBSE", "CLASS_XI");
  }, [materials]);

  const class12Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "CBSE", "CLASS_XII");
  }, [materials]);

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">

      {/* Hero Banner: CBSE Electric Cyan Theme */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#021323] via-[#051c30] to-[#010810] border border-cyan-500/30 p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,217,255,0.12)]">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00D9FF] animate-pulse" />
              <span>NATIONAL SYLLABUS • CBSE BOARD ARCHIVE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-serif italic">
              CBSE Chemistry Academic Vault
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-2xl">
              Engineered with 100% NCERT line-by-line alignment, chapter derivations, competitive bridge problems, and Board exemplary numerical sets for Class XI and XII.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>100% NCERT Aligned</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Board Exemplar Series</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Derivation Blueprints</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: Dedicated Dual Portals for Class XI & Class XII */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div>
          <h2 className="text-xs font-mono tracking-[0.2em] text-cyan-400 uppercase">
            Choose Academic Class
          </h2>
          <p className="text-2xl font-bold text-white mt-1">
            CBSE Chemistry Class Portals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Class XI Card */}
          <Link
            href="/study-material/cbse/class-xi"
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-cyan-950/30 hover:to-white/[0.03] border border-cyan-500/20 hover:border-cyan-400/60 p-8 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,217,255,0.18)] shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-wider text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                  FOUNDATION & BRIDGING
                </span>
                <span className="text-xs font-mono text-cyan-400/80">
                  {class11Materials.length} Documents
                </span>
              </div>

              <div>
                <h3 className="text-3xl font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                  Class XI Chemistry
                </h3>
                <p className="text-xs sm:text-sm text-slate-300/80 font-light mt-2 leading-relaxed">
                  Atomic structure, chemical bonding, thermodynamics, equilibrium, redox reactions, and fundamental organic principles.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Atomic Theory</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Thermodynamics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Equilibrium</span>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Class 11 CBSE Syllabus</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                <span>Enter Class XI Vault</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Class XII Card */}
          <Link
            href="/study-material/cbse/class-xii"
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-cyan-950/30 hover:to-white/[0.03] border border-cyan-500/20 hover:border-cyan-400/60 p-8 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,217,255,0.18)] shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-wider text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                  BOARD & COMPETITIVE MASTERY
                </span>
                <span className="text-xs font-mono text-cyan-400/80">
                  {class12Materials.length} Documents
                </span>
              </div>

              <div>
                <h3 className="text-3xl font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                  Class XII Chemistry
                </h3>
                <p className="text-xs sm:text-sm text-slate-300/80 font-light mt-2 leading-relaxed">
                  Solutions, electrochemistry, kinetics, coordination compounds, haloalkanes, alcohols, carbonyl compounds, and biomolecules.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Solutions & Kinetics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Coordination</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Organic Roadmaps</span>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Class 12 CBSE Syllabus</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                <span>Enter Class XII Vault</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

        </div>
      </div>

          </div>
  );
}