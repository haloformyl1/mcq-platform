"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
   
  FileCheck, 
   
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
  FlaskConical,
  TestTube2
} from "lucide-react";
import { 
  StudyMaterialItem, 
  RESOURCE_CATEGORIES, 
  filterMaterialsForContext 
} from "./curriculumData";

interface IcseCurriculumPageProps {
  materials: StudyMaterialItem[];
  student?: any;
  basePath?: string;
}

export default function IcseCurriculumPage({
  materials,
  student,
  basePath = "/study-material"
}: IcseCurriculumPageProps) {
  const class11Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "ICSE", "CLASS_XI");
  }, [materials]);

  const class12Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "ICSE", "CLASS_XII");
  }, [materials]);

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-200">

      {/* Hero Banner: ICSE / ISC Imperial Gold / Amber Theme */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1303] via-[#2a1d06] to-[#0c0902] border border-amber-500/30 p-8 sm:p-12 shadow-[0_20px_60px_rgba(245,158,11,0.12)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B] animate-pulse" />
              <span>COUNCIL SYLLABUS • CISCE ISC ARCHIVE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-serif italic">
              ICSE / ISC Council Chemistry Archive
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-2xl">
              In-depth organic reaction mechanisms, physical derivations, analytical laboratory guides, and Council specimen papers engineered for ISC Class XI & XII.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-400" />
                <span>Analytical Lab Guides</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Council Specimen Papers</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Reaction Mechanisms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Portals for Class XI & Class XII ISC */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        <div>
          <h2 className="text-xs font-mono tracking-[0.2em] text-amber-400 uppercase">
            Choose Academic Class
          </h2>
          <p className="text-2xl font-bold text-white mt-1">
            ISC Council Chemistry Portals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Class XI Card */}
          <Link
            href="/study-material/icse/class-xi"
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-amber-950/30 hover:to-white/[0.03] border border-amber-500/20 hover:border-amber-400/60 p-8 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(245,158,11,0.18)] shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-wider text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30">
                  FOUNDATION & PRACTICALS
                </span>
                <span className="text-xs font-mono text-amber-400/80">
                  {class11Materials.length} Documents
                </span>
              </div>

              <div>
                <h3 className="text-3xl font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  Class XI ISC Chemistry
                </h3>
                <p className="text-xs sm:text-sm text-slate-300/80 font-light mt-2 leading-relaxed">
                  Chemical bonding, redox equations, gas laws, thermodynamics, fundamental periodic trends, and introductory volumetric analysis.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Gas Laws & States</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Volumetric Titration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Chemical Bonding</span>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Class 11 ISC Syllabus</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                <span>Enter Class XI Vault</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Class XII Card */}
          <Link
            href="/study-material/icse/class-xii"
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-amber-950/30 hover:to-white/[0.03] border border-amber-500/20 hover:border-amber-400/60 p-8 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(245,158,11,0.18)] shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-wider text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30">
                  COUNCIL BOARD EXAMS
                </span>
                <span className="text-xs font-mono text-amber-400/80">
                  {class12Materials.length} Documents
                </span>
              </div>

              <div>
                <h3 className="text-3xl font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  Class XII ISC Chemistry
                </h3>
                <p className="text-xs sm:text-sm text-slate-300/80 font-light mt-2 leading-relaxed">
                  Advanced organic syntheses, chemical kinetics, solutions, coordination chemistry, qualitative salt analysis, and specimen question papers.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Organic Mechanisms</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Salt Analysis</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">Specimen Solutions</span>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Class 12 ISC Syllabus</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
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