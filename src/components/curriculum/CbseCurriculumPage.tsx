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
import UpgradeModal from "./UpgradeModal";

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
  const [upgradeItem, setUpgradeItem] = useState<StudyMaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"ALL" | "PHYSICAL" | "INORGANIC" | "ORGANIC">("ALL");

  const isComp = student?.subscriptionStatus === "COMPLIMENTARY";
  const isPaid = student?.subscriptionStatus === "PAID" && (
    !student?.subscriptionExpiresAt || new Date(student?.subscriptionExpiresAt).getTime() > Date.now()
  );
  const isGold = isComp || isPaid;

  const cbseMaterials = useMemo(() => {
    return filterMaterialsForContext(materials, "CBSE");
  }, [materials]);

  const class11Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "CBSE", "CLASS_XI");
  }, [materials]);

  const class12Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "CBSE", "CLASS_XII");
  }, [materials]);

  const filteredList = useMemo(() => {
    return cbseMaterials.filter(item => {
      if (disciplineFilter !== "ALL" && item.discipline !== disciplineFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.title.toLowerCase().includes(q) || 
               (item.description && item.description.toLowerCase().includes(q)) ||
               (item.chapterTitle && item.chapterTitle.toLowerCase().includes(q));
      }
      return true;
    });
  }, [cbseMaterials, disciplineFilter, searchQuery]);

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* Top Breadcrumb & Switcher Strip */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-400">
            <Link href="/study-material" className="hover:text-cyan-300 text-cyan-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Curriculums</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-300 font-bold uppercase tracking-wider">CBSE Board Archive</span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Switch Curriculum:</span>
            <Link href="/study-material/icse" className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 border border-white/[0.06] transition-colors text-[11px]">
              ICSE / ISC
            </Link>
            <Link href="/study-material/wbchse" className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-300 border border-white/[0.06] transition-colors text-[11px]">
              WBCHSE
            </Link>
            <Link href="/study-material/entrance" className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-white/[0.06] transition-colors text-[11px]">
              NEET / JEE
            </Link>
          </div>
        </div>
      </div>

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

      {/* Live CBSE Materials Preview & Direct Search */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h3 className="text-lg font-bold text-white">
              CBSE Chemistry Repository ({filteredList.length} Items)
            </h3>
            <p className="text-xs text-slate-400 font-light">
              Search and explore verified master notes and problem sets for CBSE.
            </p>
          </div>

          {/* Search & Discipline Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search CBSE notes..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
              {(["ALL", "PHYSICAL", "INORGANIC", "ORGANIC"] as const).map(disc => (
                <button
                  key={disc}
                  onClick={() => setDisciplineFilter(disc)}
                  className={`px-2.5 py-1 rounded ${disciplineFilter === disc ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
                >
                  {disc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {filteredList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.slice(0, 9).map(item => {
              const canAccess = !item.isPremium || isGold;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-cyan-500/40 p-5 flex flex-col justify-between transition-all duration-300 shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                        Chapter {String(item.chapterNumber).padStart(2, "0")} · {item.discipline}
                      </span>
                      {item.isPremium ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                          <Sparkle className="w-2.5 h-2.5" />
                          <span>PREMIUM</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          <Check className="w-2.5 h-2.5" />
                          <span>FREE</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white leading-snug line-clamp-2">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-300/80 font-light line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.category}
                    </span>

                    {canAccess ? (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/pdf-viewer/${item.id.replace("db-", "")}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </Link>
                        {item.url && (
                          <a
                            href={item.url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUpgradeItem(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-mono text-xs">
            No CBSE materials match your search filter.
          </div>
        )}
      </div>

      <UpgradeModal item={upgradeItem} onClose={() => setUpgradeItem(null)} />
    </div>
  );
}
