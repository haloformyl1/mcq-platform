"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Eye, 
  Download, 
  Lock, 
  Sparkle, 
  Check, 
  FolderOpen
,
  ArrowRight} from "lucide-react";
import { 
  StudyMaterialItem, 
  RESOURCE_CATEGORIES, 
  filterMaterialsForContext, 
  formatLevelLabel 
} from "./curriculumData";
import UpgradeModal from "./UpgradeModal";
import { isStudentEligibleForMaterial } from "@/lib/studyMaterialMetadata";

interface CurriculumCategoryPageProps {
  board: string;
  level: string;
  category: string;
  materials: StudyMaterialItem[];
  student?: any;
  basePath?: string;
}

export default function CurriculumCategoryPage({
  board,
  level,
  category,
  materials,
  student,
  basePath = "/study-material"
}: CurriculumCategoryPageProps) {
  const [upgradeItem, setUpgradeItem] = useState<StudyMaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"ALL" | "PHYSICAL" | "INORGANIC" | "ORGANIC">("ALL");
  const [sortBy, setSortBy] = useState<"CHAPTER" | "AZ">("CHAPTER");

  const isComp = student?.subscriptionStatus === "COMPLIMENTARY";
  const isPaid = student?.subscriptionStatus === "PAID" && (
    !student?.subscriptionExpiresAt || new Date(student?.subscriptionExpiresAt).getTime() > Date.now()
  );
  const isGold = isComp || isPaid;

  const categoryObj = useMemo(() => {
    return RESOURCE_CATEGORIES.find(c => c.id.toLowerCase() === category.toLowerCase() || c.name.toLowerCase().includes(category.toLowerCase())) || RESOURCE_CATEGORIES[0];
  }, [category]);

  const levelMaterials = useMemo(() => {
    return filterMaterialsForContext(materials, board, level);
  }, [materials, board, level]);

  const categoryItems = useMemo(() => {
    let items = levelMaterials.filter(categoryObj.matchFn);

    if (disciplineFilter !== "ALL") {
      items = items.filter(i => i.discipline === disciplineFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(i => 
        i.title.toLowerCase().includes(q) || 
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.chapterTitle && i.chapterTitle.toLowerCase().includes(q))
      );
    }

    return items.sort((a, b) => {
      if (sortBy === "CHAPTER") return (a.chapterNumber || 99) - (b.chapterNumber || 99);
      return a.title.localeCompare(b.title);
    });
  }, [levelMaterials, categoryObj, disciplineFilter, searchQuery, sortBy]);

  const levelFormatted = formatLevelLabel(level);
  const levelUrl = `/study-material/${board.toLowerCase()}/${level.toLowerCase().replace(/_/g, "-")}`;
  const boardUrl = `/study-material/${board.toLowerCase()}`;

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* Top Breadcrumb */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
          <Link href="/study-material" className="hover:text-white transition-colors">
            All Curriculums
          </Link>
          <span className="text-slate-600">/</span>
          <Link href={boardUrl} className="hover:text-white transition-colors uppercase">
            {board}
          </Link>
          <span className="text-slate-600">/</span>
          <Link href={levelUrl} className="hover:text-white transition-colors uppercase">
            {levelFormatted}
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-400 font-bold uppercase tracking-wider">
            {categoryObj.name}
          </span>
        </nav>
      </div>

      {/* Header with Back button */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
                {board.toUpperCase()} · {levelFormatted}
              </span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {categoryItems.length} Files Ready
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-serif italic">
              {categoryObj.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-2xl leading-relaxed">
              {categoryObj.subtitle} — {categoryObj.description}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Link
              href={levelUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {levelFormatted}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sibling Category Switcher Tabs */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-mono">
          {RESOURCE_CATEGORIES.map(cat => {
            const isActive = cat.id.toLowerCase() === category.toLowerCase();
            return (
              <Link
                key={cat.id}
                href={`/study-material/${board.toLowerCase()}/${level.toLowerCase().replace(/_/g, "-")}/${cat.id}`}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive 
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold" 
                    : "bg-white/[0.02] text-slate-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                {cat.name.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search, Discipline & Sort Filters */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by chapter, topic or title..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-64 sm:w-80"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
              {(["ALL", "PHYSICAL", "INORGANIC", "ORGANIC"] as const).map(disc => (
                <button
                  key={disc}
                  onClick={() => setDisciplineFilter(disc)}
                  className={`px-2.5 py-1 rounded ${disciplineFilter === disc ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  {disc}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
              <button
                onClick={() => setSortBy("CHAPTER")}
                className={`px-2.5 py-1 rounded ${sortBy === "CHAPTER" ? "bg-white/10 text-white font-bold" : "text-slate-400"}`}
              >
                Chapter #
              </button>
              <button
                onClick={() => setSortBy("AZ")}
                className={`px-2.5 py-1 rounded ${sortBy === "AZ" ? "bg-white/10 text-white font-bold" : "text-slate-400"}`}
              >
                A - Z
              </button>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {categoryItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categoryItems.map(item => {
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
                      : "border-white/[0.08] hover:border-cyan-500/40"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
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

                    <div>
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
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        {item.chapterTitle}
                      </p>
                    </div>

                    <p className="text-xs text-slate-300/80 font-light line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.fileSize || "Verified PDF"}
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
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">No materials found in this category.</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or discipline filter.</p>
          </div>
        )}
      </div>

      <UpgradeModal item={upgradeItem} onClose={() => setUpgradeItem(null)} student={student} />
    </div>
  );
}
