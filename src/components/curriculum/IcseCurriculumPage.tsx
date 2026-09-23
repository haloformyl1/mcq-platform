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
import UpgradeModal from "./UpgradeModal";
import { isStudentEligibleForMaterial } from "@/lib/studyMaterialMetadata";

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
  const [upgradeItem, setUpgradeItem] = useState<StudyMaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"ALL" | "PHYSICAL" | "INORGANIC" | "ORGANIC">("ALL");

  const isComp = student?.subscriptionStatus === "COMPLIMENTARY";
  const isPaid = student?.subscriptionStatus === "PAID" && (
    !student?.subscriptionExpiresAt || new Date(student?.subscriptionExpiresAt).getTime() > Date.now()
  );
  const isGold = isComp || isPaid;

  const icseMaterials = useMemo(() => {
    return filterMaterialsForContext(materials, "ICSE");
  }, [materials]);

  const class11Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "ICSE", "CLASS_XI");
  }, [materials]);

  const class12Materials = useMemo(() => {
    return filterMaterialsForContext(materials, "ICSE", "CLASS_XII");
  }, [materials]);

  const filteredList = useMemo(() => {
    return icseMaterials.filter(item => {
      if (disciplineFilter !== "ALL" && item.discipline !== disciplineFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.title.toLowerCase().includes(q) || 
               (item.description && item.description.toLowerCase().includes(q)) ||
               (item.chapterTitle && item.chapterTitle.toLowerCase().includes(q));
      }
      return true;
    });
  }, [icseMaterials, disciplineFilter, searchQuery]);

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-200">
      
      {/* Top Breadcrumb & Switcher Strip */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-400">
            <Link href="/study-material" className="hover:text-amber-300 text-amber-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Curriculums</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-amber-300 font-bold uppercase tracking-wider">ICSE / ISC Council Archive</span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Switch Curriculum:</span>
            <Link href="/study-material/cbse" className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 border border-white/[0.06] transition-colors text-[11px]">
              CBSE
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

      {/* Materials List */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h3 className="text-lg font-bold text-white">
              ICSE / ISC Materials ({filteredList.length} Items)
            </h3>
            <p className="text-xs text-slate-400 font-light">
              Explore council notes, laboratory guides, and question sets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ICSE notes..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
              {(["ALL", "PHYSICAL", "INORGANIC", "ORGANIC"] as const).map(disc => (
                <button
                  key={disc}
                  onClick={() => setDisciplineFilter(disc)}
                  className={`px-2.5 py-1 rounded ${disciplineFilter === disc ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40" : "text-slate-400 hover:text-white"}`}
                >
                  {disc}
                </button>
              ))}
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
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border p-5 flex flex-col justify-between transition-all duration-300 shadow-sm ${
                    isLevelRestricted 
                      ? "border-rose-500/35 hover:border-rose-400/60 shadow-[0_0_16px_rgba(244,63,94,0.12)]" 
                      : "border-white/[0.08] hover:border-amber-500/40"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/30 text-amber-300">
                          Chapter {String(item.chapterNumber).padStart(2, "0")} · {item.discipline}
                        </span>
                        {isLevelRestricted && (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/90 border border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                            title={restrictionReason}
                          >
                            <Lock className="w-2.5 h-2.5 text-rose-300 shrink-0" />
                            <span>{badgeLabel}</span>
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

                    <h4 
                      onClick={() => {
                        if (isLevelRestricted) {
                          setUpgradeItem({ ...item, isLevelRestricted: true, restrictionReason, badgeLabel, buttonLabel, targetLabel, policyTitle, policyNote });
                        } else if (!canAccess) {
                          setUpgradeItem(item);
                        }
                      }}
                      className={`text-base font-bold text-white leading-snug line-clamp-2 ${!canAccess ? "cursor-pointer hover:text-rose-200" : ""}`}
                    >
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 font-bold text-xs transition-colors cursor-pointer shadow-sm group/btn"
                        >
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>{buttonLabel}</span>
                          <ArrowRight className="w-3 h-3 text-rose-400/80 transition-transform group-hover/btn:translate-x-0.5" />
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
            No ICSE / ISC materials match your search filter.
          </div>
        )}
      </div>

      <UpgradeModal item={upgradeItem} onClose={() => setUpgradeItem(null)} />
    </div>
  );
}
