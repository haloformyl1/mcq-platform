"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  Eye, 
  Download, 
  Lock, 
  Sparkle, 
  Check, 
  BookOpen,
  FolderOpen
} from "lucide-react";
import { 
  StudyMaterialItem, 
  RESOURCE_CATEGORIES, 
  filterMaterialsForContext, 
  formatLevelLabel,
  BoardType
} from "./curriculumData";
import UpgradeModal from "./UpgradeModal";
import { isStudentEligibleForMaterial } from "@/lib/studyMaterialMetadata";

interface CurriculumLevelPageProps {
  board: string;
  level: string;
  materials: StudyMaterialItem[];
  student?: any;
  basePath?: string;
}

export default function CurriculumLevelPage({
  board,
  level,
  materials,
  student,
  basePath = "/study-material"
}: CurriculumLevelPageProps) {
  const router = useRouter();
  const [upgradeItem, setUpgradeItem] = useState<StudyMaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<"ALL" | "PHYSICAL" | "INORGANIC" | "ORGANIC">("ALL");

  const isComp = student?.subscriptionStatus === "COMPLIMENTARY";
  const isPaid = student?.subscriptionStatus === "PAID" && (
    !student?.subscriptionExpiresAt || new Date(student?.subscriptionExpiresAt).getTime() > Date.now()
  );
  const isGold = isComp || isPaid;

  const boardUpper = board.toUpperCase();
  const theme = useMemo(() => {
    if (boardUpper === "CBSE") {
      return {
        name: "CBSE",
        accent: "cyan",
        border: "border-cyan-500/30",
        badge: "bg-cyan-950/80 border-cyan-500/40 text-cyan-300",
        btn: "bg-cyan-500 hover:bg-cyan-400 text-black",
        linkHover: "hover:text-cyan-300",
        cardBorder: "hover:border-cyan-500/50 hover:shadow-[0_12px_30px_rgba(0,217,255,0.15)]",
        parentUrl: "/study-material/cbse"
      };
    }
    if (boardUpper === "ICSE") {
      return {
        name: "ICSE / ISC",
        accent: "amber",
        border: "border-amber-500/30",
        badge: "bg-amber-950/80 border-amber-500/40 text-amber-300",
        btn: "bg-amber-500 hover:bg-amber-400 text-black",
        linkHover: "hover:text-amber-300",
        cardBorder: "hover:border-amber-500/50 hover:shadow-[0_12px_30px_rgba(245,158,11,0.15)]",
        parentUrl: "/study-material/icse"
      };
    }
    if (boardUpper === "WBCHSE") {
      return {
        name: "WBCHSE",
        accent: "emerald",
        border: "border-emerald-500/30",
        badge: "bg-emerald-950/80 border-emerald-500/40 text-emerald-300",
        btn: "bg-emerald-500 hover:bg-emerald-400 text-black",
        linkHover: "hover:text-emerald-300",
        cardBorder: "hover:border-emerald-500/50 hover:shadow-[0_12px_30px_rgba(16,185,129,0.15)]",
        parentUrl: "/study-material/wbchse"
      };
    }
    return {
      name: "Competitive Entrance",
      accent: "rose",
      border: "border-rose-500/30",
      badge: "bg-rose-950/80 border-rose-500/40 text-rose-300",
      btn: "bg-rose-500 hover:bg-rose-400 text-white",
      linkHover: "hover:text-rose-300",
      cardBorder: "hover:border-rose-500/50 hover:shadow-[0_12px_30px_rgba(244,63,94,0.15)]",
      parentUrl: "/study-material/entrance"
    };
  }, [boardUpper]);

  const levelMaterials = useMemo(() => {
    return filterMaterialsForContext(materials, board, level);
  }, [materials, board, level]);

  const categoryCards = useMemo(() => {
    return RESOURCE_CATEGORIES.map(cat => {
      const count = levelMaterials.filter(cat.matchFn).length;
      return { ...cat, count };
    });
  }, [levelMaterials]);

  const filteredList = useMemo(() => {
    return levelMaterials.filter(item => {
      if (disciplineFilter !== "ALL" && item.discipline !== disciplineFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.title.toLowerCase().includes(q) || 
               (item.description && item.description.toLowerCase().includes(q)) ||
               (item.chapterTitle && item.chapterTitle.toLowerCase().includes(q));
      }
      return true;
    });
  }, [levelMaterials, disciplineFilter, searchQuery]);

  const levelFormatted = formatLevelLabel(level);
  const isEntranceExam = board === "ENTRANCE" || ["neet", "jee", "wbjee", "cuet"].includes(level.toLowerCase());

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* Top Breadcrumb */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
          <Link href="/study-material" className="hover:text-white transition-colors">
            All Curriculums
          </Link>
          <span className="text-slate-600">/</span>
          <Link href={theme.parentUrl} className={`hover:text-white transition-colors uppercase ${theme.linkHover}`}>
            {theme.name}
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-white font-bold uppercase tracking-wider">
            {levelFormatted}
          </span>
        </nav>
      </div>

      {/* Hero Context Banner */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border ${theme.border} backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${theme.badge}`}>
                {theme.name} · {levelFormatted}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {levelMaterials.length} Documents Available
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-serif italic">
              {levelFormatted} Chemistry Vault
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-2xl leading-relaxed">
              Targeted study notes, practice problems, previous questions, and examination bibles calibrated specifically for {theme.name} {levelFormatted}.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Link
              href={theme.parentUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {theme.name}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Categories Grid (Hidden for Entrance: NEET/JEE/WBJEE/CUET show contents directly) */}
      {!isEntranceExam && (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-mono tracking-[0.2em] text-slate-400 uppercase">
              Academic Resource Categories
            </h2>
            <p className="text-lg font-bold text-white mt-0.5">
              Select a category to explore dedicated documents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryCards.map(cat => {
            const Icon = cat.icon;
            const categoryUrl = `/study-material/${board.toLowerCase()}/${level.toLowerCase().replace(/_/g, "-")}/${cat.id}`;

            return (
              <Link
                key={cat.id}
                href={categoryUrl}
                className={`group cursor-pointer select-none active:bg-white/[0.08] active:border-white/30 touch-manipulation rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] ${theme.cardBorder} p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-sm`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200 group-hover:text-white transition-colors">
                      {cat.name}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-xs font-mono text-slate-400">
                    {cat.subtitle}
                  </p>

                  <p className="text-xs text-slate-300/80 font-light leading-relaxed pt-1">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">
                    {cat.count > 0 ? (
                      <span className="text-emerald-400 font-semibold">{cat.count} Ready</span>
                    ) : (
                      <span className="text-slate-500">Under curation</span>
                    )}
                  </span>
                  <div className="inline-flex items-center gap-1 font-bold text-slate-300 group-hover:text-white transition-colors">
                    <span>Open Category</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      )}

      {/* Quick Search & Materials Preview for this Level */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h3 className="text-lg font-bold text-white">
              All Materials in {levelFormatted} ({filteredList.length})
            </h3>
            <p className="text-xs text-slate-400 font-light">
              Direct access to notes, questions, and revision sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${levelFormatted} notes...`}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
              {(["ALL", "PHYSICAL", "INORGANIC", "ORGANIC"] as const).map(disc => (
                <button
                  key={disc}
                  onClick={() => setDisciplineFilter(disc)}
                  className={`px-2.5 py-1 rounded ${disciplineFilter === disc ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  {disc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map(item => {
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
                  className={`rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border p-5 flex flex-col justify-between transition-all duration-200 shadow-sm touch-manipulation select-none ${
                    isLevelRestricted 
                      ? "border-rose-500/35 hover:border-rose-400/60 shadow-[0_0_16px_rgba(244,63,94,0.12)]" 
                      : "border-white/[0.08] hover:border-cyan-500/40"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-slate-300">
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
                        } else {
                          router.push(`/dashboard/pdf-viewer/${item.id.replace("db-", "")}`);
                        }
                      }}
                      className={`text-base font-bold text-white leading-snug line-clamp-2 cursor-pointer transition-colors ${
                        !canAccess ? "hover:text-rose-200" : "hover:text-cyan-300"
                      }`}
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
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${theme.btn} font-bold text-xs transition-colors`}
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
            No materials found for {levelFormatted} with the selected filter.
          </div>
        )}
      </div>

      <UpgradeModal item={upgradeItem} onClose={() => setUpgradeItem(null)} />
    </div>
  );
}
