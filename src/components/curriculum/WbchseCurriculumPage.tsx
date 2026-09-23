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
import UpgradeModal from "./UpgradeModal";
import { isStudentEligibleForMaterial } from "@/lib/studyMaterialMetadata";

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
  const [upgradeItem, setUpgradeItem] = useState<StudyMaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"ALL" | "PHYSICAL" | "INORGANIC" | "ORGANIC">("ALL");
  const [bilingualFilter, setBilingualFilter] = useState<"ALL" | "BENGALI" | "ENGLISH">("ALL");

  const isComp = student?.subscriptionStatus === "COMPLIMENTARY";
  const isPaid = student?.subscriptionStatus === "PAID" && (
    !student?.subscriptionExpiresAt || new Date(student?.subscriptionExpiresAt).getTime() > Date.now()
  );
  const isGold = isComp || isPaid;

  const wbMaterials = useMemo(() => {
    return filterMaterialsForContext(materials, "WBCHSE");
  }, [materials]);

  const sem1Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_1"), [materials]);
  const sem2Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_2"), [materials]);
  const sem3Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_3"), [materials]);
  const sem4Materials = useMemo(() => filterMaterialsForContext(materials, "WBCHSE", "SEM_4"), [materials]);

  const filteredList = useMemo(() => {
    return wbMaterials.filter(item => {
      if (disciplineFilter !== "ALL" && item.discipline !== disciplineFilter) return false;
      
      const titleLower = item.title.toLowerCase();
      const descLower = (item.description || "").toLowerCase();
      const hasBengali = /[\u0980-\u09FF]/.test(item.title) || titleLower.includes("bangla") || descLower.includes("bangla") || titleLower.includes("bengali");
      
      if (bilingualFilter === "BENGALI" && !hasBengali) return false;
      if (bilingualFilter === "ENGLISH" && hasBengali) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return titleLower.includes(q) || 
               descLower.includes(q) ||
               (item.chapterTitle && item.chapterTitle.toLowerCase().includes(q));
      }
      return true;
    });
  }, [wbMaterials, disciplineFilter, bilingualFilter, searchQuery]);

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      
      {/* Top Breadcrumb & Switcher Strip */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-400">
            <Link href="/study-material" className="hover:text-emerald-300 text-emerald-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Curriculums</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-300 font-bold uppercase tracking-wider">WBCHSE Semester Portal</span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Switch Curriculum:</span>
            <Link href="/study-material/cbse" className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 border border-white/[0.06] transition-colors text-[11px]">
              CBSE
            </Link>
            <Link href="/study-material/icse" className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-300 border border-white/[0.06] transition-colors text-[11px]">
              ICSE / ISC
            </Link>
            <Link href="/study-material/entrance" className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-white/[0.06] transition-colors text-[11px]">
              NEET / JEE
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Banner: WBCHSE Emerald Mint Theme */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#021812] via-[#05281e] to-[#010c08] border border-emerald-500/30 p-8 sm:p-12 shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
              <span>SEMESTER SYSTEM (NEW) • WBCHSE BOARD PORTAL</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-serif italic">
              WBCHSE Chemistry Semester System Portal
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-2xl">
              Calibrated for the new Higher Secondary 4-Semester credit structure. Featuring bilingual English & Bengali (বাংলা) chemistry notes, new pattern MCQ question banks, and WBJEE high-frequency problem sets.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-emerald-400" />
                <span>Bilingual English & বাংলা Notes</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>4-Semester Credit Structure</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>WBJEE Integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
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
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
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
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
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
            className="group relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:from-emerald-950/30 hover:to-white/[0.03] border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_35px_rgba(16,185,129,0.18)] shadow-md"
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

      {/* Materials List */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h3 className="text-lg font-bold text-white">
              WBCHSE Chemistry Repository ({filteredList.length} Items)
            </h3>
            <p className="text-xs text-slate-400 font-light">
              Explore semester notes, bilingual study guides, and WBJEE problems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search WBCHSE notes..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 w-48 sm:w-64"
              />
            </div>

            {/* Bilingual Filter */}
            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
              <button
                onClick={() => setBilingualFilter("ALL")}
                className={`px-2 py-0.5 rounded ${bilingualFilter === "ALL" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400"}`}
              >
                All
              </button>
              <button
                onClick={() => setBilingualFilter("BENGALI")}
                className={`px-2 py-0.5 rounded ${bilingualFilter === "BENGALI" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400"}`}
              >
                বাংলা (Bengali)
              </button>
              <button
                onClick={() => setBilingualFilter("ENGLISH")}
                className={`px-2 py-0.5 rounded ${bilingualFilter === "ENGLISH" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-400"}`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {filteredList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.slice(0, 9).map(item => {
              const eligibility = isStudentEligibleForMaterial(student, item.section, item.classSem);
              const isLevelRestricted = student ? !eligibility.eligible : Boolean(item.isLevelRestricted);
              const restrictionReason = eligibility.reason || item.restrictionReason;
              const badgeLabel = eligibility.badgeLabel || item.badgeLabel || (item.classSem === 'ALL' ? (item.section || 'RESTRICTED') : `${item.classSem} ONLY`);
              const buttonLabel = eligibility.buttonLabel || item.buttonLabel || `Restricted (${item.classSem === 'ALL' ? (item.section || 'Curriculum') : item.classSem})`;
              const targetLabel = eligibility.targetLabel || item.targetLabel;
              const policyTitle = eligibility.policyTitle || item.policyTitle;
              const policyNote = eligibility.policyNote || item.policyNote;
              const canAccess = !isLevelRestricted && (!item.isPremium || isGold);
              const isBengali = /[\u0980-\u09FF]/.test(item.title) || item.title.toLowerCase().includes("bangla");

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/40 p-5 flex flex-col justify-between transition-all duration-300 shadow-sm"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
                          Chapter {String(item.chapterNumber).padStart(2, "0")} · {item.discipline}
                        </span>
                        {isBengali && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            বাংলা
                          </span>
                        )}
                      </div>
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Read</span>
                        </Link>
                        {item.url && item.url !== "#locked" && (
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
                    ) : isLevelRestricted ? (
                        <button
                          type="button"
                          onClick={() => setUpgradeItem({ ...item, isLevelRestricted: true, restrictionReason, badgeLabel, buttonLabel, targetLabel, policyTitle, policyNote })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                        >
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>{buttonLabel}</span>
                        </button>
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
            No WBCHSE materials match your filter criteria.
          </div>
        )}
      </div>

      <UpgradeModal item={upgradeItem} onClose={() => setUpgradeItem(null)} />
    </div>
  );
}
