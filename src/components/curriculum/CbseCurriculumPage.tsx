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
import ContentUpdateNotice from "./ContentUpdateNotice";

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
    <div className="w-full min-h-[calc(100vh-14rem)] flex flex-col items-center justify-center text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* STEP 2: Dedicated Dual Portals for Class XI & Class XII */}
      <div className="w-full max-w-4xl mx-auto space-y-6 flex flex-col items-center">
        {/* Daily Content Upload Notification */}
        <ContentUpdateNotice variant="cyan" />

        <div className="text-center pt-2">
          <h2 className="text-xs sm:text-sm font-mono tracking-[0.25em] text-cyan-400 uppercase">
            Step 2: Choose Academic Class
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* Class XI Card */}
          <Link
            href="/study-material/cbse/class-xi"
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-cyan-950/30 hover:to-white/[0.03] border border-cyan-500/20 hover:border-cyan-400/60 p-8 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,217,255,0.18)] shadow-lg"
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
            className="group relative cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-cyan-950/30 hover:to-white/[0.03] border border-cyan-500/20 hover:border-cyan-400/60 p-8 flex flex-col justify-between min-h-[260px] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,217,255,0.18)] shadow-lg"
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