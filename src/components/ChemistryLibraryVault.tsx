"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, FileText, Layers, Flame, Award, 
  GraduationCap, FileCheck, Search, Filter, Sparkles, 
  Download, ExternalLink, Lock, CheckCircle2, 
  Clock, Eye, X, ChevronRight, HelpCircle,
  FolderOpen, ArrowUpRight, Share2, BookMarked, Atom,
  Check, LayoutGrid
} from 'lucide-react';
import { 
  LibraryCategory, 
  SubjectDiscipline, 
  LibraryItem, 
  CURATED_LIBRARY_DATA 
} from '@/data/libraryResources';

interface ChemistryLibraryVaultProps {
  studyMaterials?: any[];
  student?: any;
}

export default function ChemistryLibraryVault({ studyMaterials = [], student }: ChemistryLibraryVaultProps) {
  const [activeCategory, setActiveCategory] = useState<LibraryCategory>('ALL');
  const [activeDiscipline, setActiveDiscipline] = useState<SubjectDiscipline>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);

  // Subscription verification
  const isComp = student?.subscriptionStatus === 'COMPLIMENTARY';
  const isPaid = student?.subscriptionStatus === 'PAID' && (
    !student?.subscriptionExpiresAt || new Date(student?.subscriptionExpiresAt).getTime() > Date.now()
  );
  const isGold = isComp || isPaid;

  // Merge dynamic DB materials (strictly admin uploaded)
  const mergedItems = useMemo<LibraryItem[]>(() => {
    const dbItems: LibraryItem[] = studyMaterials.map((mat: any) => {
      const is3D = mat.category === '3D animations' || mat.type === 'LINK';
      const targetCat: Exclude<LibraryCategory, 'ALL'> = mat.category || (is3D ? '3D animations' : 'Chapter wise PDF Notes');
      const disc: LibraryItem['discipline'] = mat.discipline || 'GENERAL';

      return {
        id: 'db-' + mat.id,
        title: mat.title,
        description: mat.description || mat.cleanDescription || 'Curated study material provided for your syllabus and batch.',
        category: targetCat,
        discipline: disc,
        chapter: mat.title.split('(')[0]?.trim() || 'Curriculum Vault',
        badgeText: mat.type === 'LINK' ? '3D Interactive Lab' : 'Official PDF',
        fileSize: mat.fileSize || (mat.type === 'LINK' ? 'Interactive Lab' : 'PDF Document'),
        url: mat.url,
        isPremium: !!mat.isPremium,
        pagesOrCount: mat.type === 'LINK' ? 'Interactive 3D' : 'Official Guide',
        isFromDb: true
      };
    });

    return [...dbItems, ...CURATED_LIBRARY_DATA];
  }, [studyMaterials]);

  // Counts for each of the 7 categories + ALL
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'ALL': mergedItems.length,
      '3D animations': 0,
      'Chapter wise PDF Notes': 0,
      'Daily practice problems (DPPs)': 0,
      'NEET Prev. 34 Years': 0,
      'JEE (MAINS) Prev. Years': 0,
      'WBJEE Prev. Years': 0,
      'Class Exams PDF': 0
    };

    mergedItems.forEach(item => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });

    return counts;
  }, [mergedItems]);

  // Filtered items based on activeCategory, activeDiscipline, and searchQuery
  const filteredItems = useMemo(() => {
    return mergedItems.filter(item => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }

      if (activeDiscipline !== 'ALL') {
        if (item.discipline !== activeDiscipline && item.discipline !== 'GENERAL') {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) || false;
        const matchesChapter = item.chapter?.toLowerCase().includes(query) || false;
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesBadge = item.badgeText.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesChapter && !matchesCategory && !matchesBadge) {
          return false;
        }
      }

      return true;
    });
  }, [mergedItems, activeCategory, activeDiscipline, searchQuery]);

  // The 7 Bento Shelf Definitions with custom aesthetics
  const BENTO_SHELVES: {
    id: Exclude<LibraryCategory, 'ALL'>;
    title: string;
    tagline: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    activeBorder: string;
    activeBg: string;
    glowShadow: string;
    accentBadge: string;
  }[] = [
    {
      id: '3D animations',
      title: '3D animations',
      tagline: 'Interactive WebGL molecular structures & reaction mechanics',
      icon: Atom,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-950/80 border-sky-500/30 text-sky-400',
      activeBorder: 'border-sky-400 ring-1 ring-sky-400',
      activeBg: 'from-sky-950/70 via-[#07192a] to-[#04111d]',
      glowShadow: 'shadow-[0_0_25px_rgba(56,189,248,0.2)]',
      accentBadge: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    },
    {
      id: 'Chapter wise PDF Notes',
      title: 'Chapter wise PDF Notes',
      tagline: 'Comprehensive classroom theory, derivations & formula bibles',
      icon: BookOpen,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400',
      activeBorder: 'border-emerald-400 ring-1 ring-emerald-400',
      activeBg: 'from-emerald-950/70 via-[#051f18] to-[#03130e]',
      glowShadow: 'shadow-[0_0_25px_rgba(52,211,153,0.2)]',
      accentBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'Daily practice problems (DPPs)',
      title: 'Daily practice problems (DPPs)',
      tagline: 'Targeted chapter question sets with step-by-step answer keys',
      icon: CheckCircle2,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-950/80 border-amber-500/30 text-amber-400',
      activeBorder: 'border-amber-400 ring-1 ring-amber-400',
      activeBg: 'from-amber-950/70 via-[#1f1606] to-[#120d03]',
      glowShadow: 'shadow-[0_0_25px_rgba(251,191,36,0.2)]',
      accentBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    },
    {
      id: 'NEET Prev. 34 Years',
      title: 'NEET Prev. 34 Years',
      tagline: '1990-2024 Chapter-wise solved question bank with NCERT citations',
      icon: Flame,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-950/80 border-rose-500/30 text-rose-400',
      activeBorder: 'border-rose-400 ring-1 ring-rose-400',
      activeBg: 'from-rose-950/70 via-[#210910] to-[#14050a]',
      glowShadow: 'shadow-[0_0_25px_rgba(251,113,133,0.2)]',
      accentBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    },
    {
      id: 'JEE (MAINS) Prev. Years',
      title: 'JEE (MAINS) Prev. Years',
      tagline: 'Authentic NTA shift papers, chapter PYQs & numerical problem banks',
      icon: Award,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-950/80 border-violet-500/30 text-violet-400',
      activeBorder: 'border-violet-400 ring-1 ring-violet-400',
      activeBg: 'from-violet-950/70 via-[#190928] to-[#0f041a]',
      glowShadow: 'shadow-[0_0_25px_rgba(167,139,250,0.2)]',
      accentBadge: 'bg-violet-500/15 text-violet-300 border-violet-500/30'
    },
    {
      id: 'WBJEE Prev. Years',
      title: 'WBJEE Prev. Years',
      tagline: '15-Year solved chemistry archive with Category 1, 2 & 3 mastersets',
      icon: GraduationCap,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-950/80 border-teal-500/30 text-teal-400',
      activeBorder: 'border-teal-400 ring-1 ring-teal-400',
      activeBg: 'from-teal-950/70 via-[#051c1c] to-[#021111]',
      glowShadow: 'shadow-[0_0_25px_rgba(45,212,191,0.2)]',
      accentBadge: 'bg-teal-500/15 text-teal-300 border-teal-500/30'
    },
    {
      id: 'Class Exams PDF',
      title: 'Class Exams PDF',
      tagline: 'Weekly benchmark tests, grand simulations & official evaluation sheets',
      icon: FileCheck,
      iconColor: 'text-fuchsia-400',
      iconBg: 'bg-fuchsia-950/80 border-fuchsia-500/30 text-fuchsia-400',
      activeBorder: 'border-fuchsia-400 ring-1 ring-fuchsia-400',
      activeBg: 'from-fuchsia-950/70 via-[#210923] to-[#130414]',
      glowShadow: 'shadow-[0_0_25px_rgba(232,121,249,0.2)]',
      accentBadge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30'
    }
  ];

  return (
    <section id="materials" className="space-y-8 pt-2">
      {/* 1. JUMBOTRON HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#07131e] via-[#091b2c] to-[#0b1624] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>PIECHEM DIGITAL STUDY REPOSITORY & LAB VAULT</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-3">
              <span>Chemistry Library & Digital Archives</span>
              <span className="text-xs px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono font-bold">
                {mergedItems.length} {mergedItems.length === 1 ? 'Resource' : 'Resources'} Live
              </span>
            </h2>

            <p className="text-sm text-slate-300/90 leading-relaxed">
              Explore 7 specialised archives: interactive 3D simulations, classroom notes, daily practice problems (DPPs), 
              competitive archives for <strong className="text-white">NEET (34 Yrs)</strong>, <strong className="text-white">JEE (Mains)</strong>, <strong className="text-white">WBJEE</strong>, and official class exam PDFs.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-[#050f18]/90 border border-cyan-500/25 p-4 rounded-2xl flex items-center gap-4 shrink-0 shadow-lg">
            <div className="text-center px-2">
              <span className="text-xl font-black text-cyan-400 font-mono block">
                {categoryCounts['3D animations']}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">3D Labs</span>
            </div>
            <div className="w-px h-8 bg-cyan-900/50" />
            <div className="text-center px-2">
              <span className="text-xl font-black text-emerald-400 font-mono block">
                {categoryCounts['ALL'] - categoryCounts['3D animations']}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Documents</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE 7-WING BENTO LIBRARY GRID */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-cyan-400" />
              <span>Digital Library Shelves (7 Specialised Wings)</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any shelf tile below to browse its dedicated collection.
            </p>
          </div>

          {/* All Archives Switcher */}
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              activeCategory === 'ALL'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/30'
                : 'bg-[#081523] text-slate-300 border-slate-700 hover:text-white hover:border-cyan-500/40'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Show All Archives ({mergedItems.length})</span>
          </button>
        </div>

        {/* Bento Grid: 7 Shelf Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {BENTO_SHELVES.map((shelf, index) => {
            const Icon = shelf.icon;
            const isSelected = activeCategory === shelf.id;
            const count = categoryCounts[shelf.id] ?? 0;
            const hasItems = count > 0;

            // Make the first card span slightly or remain balanced
            const isWide = index === 0;

            return (
              <div
                key={shelf.id}
                onClick={() => setActiveCategory(shelf.id)}
                className={`group relative cursor-pointer p-4 sm:p-4.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 overflow-hidden ${
                  isSelected
                    ? `bg-gradient-to-br ${shelf.activeBg} ${shelf.activeBorder} ${shelf.glowShadow} scale-[1.02]`
                    : 'bg-[#081523]/80 hover:bg-[#0c1e30] border-slate-800/90 hover:border-slate-700 hover:scale-[1.01]'
                }`}
              >
                {/* Active Indicator Glow */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                )}

                {/* Top Row: Icon and Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className={`p-2.5 rounded-xl border ${shelf.iconBg} shadow-inner transition group-hover:scale-110 duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasItems ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono border flex items-center gap-1 ${shelf.accentBadge} animate-pulse`}>
                        <span>{count}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider font-sans">Live</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>Curating</span>
                      </span>
                    )}

                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                </div>

                {/* Middle: Title and Tagline */}
                <div className="space-y-1">
                  <h3 className={`font-extrabold text-sm sm:text-base leading-snug transition ${
                    isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                    {shelf.title}
                  </h3>
                  <p className="text-xs text-slate-400/90 line-clamp-2 leading-relaxed">
                    {shelf.tagline}
                  </p>
                </div>

                {/* Bottom Bar: Action Hint */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-semibold">
                  <span className={`transition ${isSelected ? shelf.iconColor : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {isSelected ? 'Currently Browsing' : 'Explore Shelf'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isSelected ? `translate-x-1 ${shelf.iconColor}` : 'text-slate-400 group-hover:translate-x-0.5'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH & SUBJECT DISCIPLINE FILTER BAR */}
      <div className="bg-[#081523]/80 border border-cyan-900/40 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, topics, chapters..."
            className="w-full bg-[#040c14] border border-cyan-500/20 focus:border-cyan-400 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0 justify-start md:justify-end">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1 shrink-0 hidden sm:inline">
            Branch:
          </span>
          {(['ALL', 'PHYSICAL', 'INORGANIC', 'ORGANIC'] as SubjectDiscipline[]).map((disc) => {
            const isDiscActive = activeDiscipline === disc;
            const labels: Record<SubjectDiscipline, string> = {
              ALL: 'All Branches',
              PHYSICAL: 'Physical',
              INORGANIC: 'Inorganic',
              ORGANIC: 'Organic'
            };

            return (
              <button
                key={disc}
                onClick={() => setActiveDiscipline(disc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isDiscActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold shadow-cyan-500/30'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {labels[disc]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CURRENT SHELF HEADER & COUNTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 border-b border-slate-800/80 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
            Viewing:
          </span>
          <span className="text-sm font-black text-white flex flex-wrap items-center gap-2">
            <span>{activeCategory === 'ALL' ? 'All Library Shelves' : activeCategory}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
              {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'} Available
            </span>
          </span>
        </div>

        {activeCategory !== 'ALL' && (
          <button
            onClick={() => setActiveCategory('ALL')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 cursor-pointer"
          >
            Reset Shelf Filter
          </button>
        )}
      </div>

      {/* 5. RESOURCE CARD GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#071420]/80 border border-cyan-900/30 p-12 rounded-3xl text-center space-y-3 shadow-xl">
          <BookOpen className="w-10 h-10 text-cyan-500/40 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {activeCategory === 'ALL' 
              ? 'No Library Materials Published Yet' 
              : `No Materials Published Under ${activeCategory} Yet`}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {activeCategory === 'ALL'
              ? 'Your faculty has not published study materials yet. Check back soon for uploaded guides, DPPs, and 3D models.'
              : `Materials for ${activeCategory} will appear here as soon as your faculty publishes them in the admin portal.`}
          </p>
          {(activeCategory !== 'ALL' || activeDiscipline !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('ALL');
                setActiveDiscipline('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reset Filters & View All
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const is3D = item.category === '3D animations';
            const isPyq = item.category.includes('Years');
            const isExam = item.category === 'Class Exams PDF';
            const isDpp = item.category.includes('DPP');

            let categoryBadgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
            if (item.category === '3D animations') categoryBadgeColor = 'bg-sky-950/80 text-sky-300 border-sky-500/40';
            else if (item.category === 'Chapter wise PDF Notes') categoryBadgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
            else if (item.category === 'Daily practice problems (DPPs)') categoryBadgeColor = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
            else if (item.category === 'NEET Prev. 34 Years') categoryBadgeColor = 'bg-rose-950/80 text-rose-300 border-rose-500/40';
            else if (item.category === 'JEE (MAINS) Prev. Years') categoryBadgeColor = 'bg-violet-950/80 text-violet-300 border-violet-500/40';
            else if (item.category === 'WBJEE Prev. Years') categoryBadgeColor = 'bg-teal-950/80 text-teal-300 border-teal-500/40';
            else if (item.category === 'Class Exams PDF') categoryBadgeColor = 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/40';

            let disciplineColor = 'bg-slate-800 text-slate-300';
            if (item.discipline === 'PHYSICAL') disciplineColor = 'bg-blue-950 text-blue-300 border border-blue-800/40';
            else if (item.discipline === 'INORGANIC') disciplineColor = 'bg-emerald-950 text-emerald-300 border border-emerald-800/40';
            else if (item.discipline === 'ORGANIC') disciplineColor = 'bg-amber-950 text-amber-300 border border-amber-800/40';

            const requiresGold = item.isPremium && !isGold;

            return (
              <div
                key={item.id}
                className="group relative bg-gradient-to-b from-[#0c1a29] via-[#081420] to-[#040b12] border border-cyan-500/20 hover:border-cyan-400/60 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-xl hover:shadow-[0_0_30px_rgba(0,195,255,0.18)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${categoryBadgeColor}`}>
                        {is3D && <Atom className="w-3 h-3" />}
                        {item.category === 'Chapter wise PDF Notes' && <FileText className="w-3 h-3" />}
                        {isDpp && <CheckCircle2 className="w-3 h-3" />}
                        {item.category === 'NEET Prev. 34 Years' && <Flame className="w-3 h-3" />}
                        {item.category === 'JEE (MAINS) Prev. Years' && <Award className="w-3 h-3" />}
                        {item.category === 'WBJEE Prev. Years' && <GraduationCap className="w-3 h-3" />}
                        {isExam && <FileCheck className="w-3 h-3" />}
                        <span>{item.category}</span>
                      </span>

                      {item.discipline !== 'GENERAL' && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${disciplineColor}`}>
                          {item.discipline}
                        </span>
                      )}
                    </div>

                    {item.isPremium ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-amber-950/90 text-amber-300 border border-amber-600/60 flex items-center gap-1 shadow shrink-0">
                        <span>👑 Premium</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-emerald-950/90 text-emerald-300 border border-emerald-600/60 flex items-center gap-1 shadow shrink-0">
                        <span>🔓 Free</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-300/80 line-clamp-3 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                    <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      {item.badgeText}
                    </span>
                    {item.pagesOrCount && (
                      <span className="text-slate-400">• {item.pagesOrCount}</span>
                    )}
                    {item.fileSize && (
                      <span className="text-slate-400 ml-auto">{item.fileSize}</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-cyan-950/80 flex items-center gap-2 relative z-10">
                  {requiresGold ? (
                    <Link
                      href="/dashboard/account"
                      className="w-full text-center py-2.5 px-4 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-md uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-950" />
                      <span>👑 Gold Access Required</span>
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                        title="Quick Preview and Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {is3D ? (
                        <a
                          href={item.url.startsWith('#') ? '#' : item.url}
                          target={item.url.startsWith('#') ? undefined : '_blank'}
                          rel={item.url.startsWith('#') ? undefined : 'noreferrer'}
                          onClick={(e) => {
                            if (item.url.startsWith('#')) {
                              e.preventDefault();
                              setPreviewItem(item);
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,195,255,0.25)] active:scale-95 cursor-pointer"
                        >
                          <span>Launch 3D Lab</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <a
                          href={item.url.startsWith('#') ? '#' : item.url}
                          target={item.url.startsWith('#') ? undefined : '_blank'}
                          rel={item.url.startsWith('#') ? undefined : 'noreferrer'}
                          onClick={(e) => {
                            if (item.url.startsWith('#')) {
                              e.preventDefault();
                              setPreviewItem(item);
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer"
                        >
                          <span>Read / Download PDF</span>
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. PREVIEW MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#091522] border border-cyan-500/40 rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl shadow-cyan-950/80 space-y-4 sm:space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {previewItem.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                  {previewItem.discipline} Chemistry
                </span>
              </div>
              <h3 className="text-xl font-black text-white leading-snug">
                {previewItem.title}
              </h3>
            </div>

            <p className="text-xs text-slate-300/90 leading-relaxed bg-[#050c14] p-4 rounded-xl border border-slate-800">
              {previewItem.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-[#050c14] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Format</span>
                <strong className="text-cyan-300">{previewItem.badgeText}</strong>
              </div>
              <div className="bg-[#050c14] p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Scope / Size</span>
                <strong className="text-white">{previewItem.pagesOrCount || previewItem.fileSize}</strong>
              </div>
              <div className="bg-[#050c14] p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block">Access Tier</span>
                <strong className={previewItem.isPremium ? 'text-amber-400' : 'text-emerald-400'}>
                  {previewItem.isPremium ? '👑 Premium Vault' : '🔓 Free Access'}
                </strong>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Targeted Highlights
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5 list-none pl-0">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Curated for NEET, JEE (Main & Advanced), and WBJEE preparation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Verified classroom resource with authentic answer keys and solutions</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={() => setPreviewItem(null)}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer order-2 sm:order-1"
              >
                Close Preview
              </button>

              {previewItem.isPremium && !isGold ? (
                <Link
                  href="/dashboard/account"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow uppercase tracking-wider"
                >
                  Upgrade to Gold
                </Link>
              ) : (
                <a
                  href={previewItem.url.startsWith('#') ? '#' : previewItem.url}
                  target={previewItem.url.startsWith('#') ? undefined : '_blank'}
                  rel={previewItem.url.startsWith('#') ? undefined : 'noreferrer'}
                  onClick={(e) => {
                    if (previewItem.url.startsWith('#')) {
                      e.preventDefault();
                      alert('Document preview: Opening document in viewer.');
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  <span>{previewItem.category === '3D animations' ? 'Launch Interactive 3D' : 'Open / Download PDF'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
