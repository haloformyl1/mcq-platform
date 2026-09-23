"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  BookOpen, 
  FileText, 
  Search, 
  Filter, 
  Sparkles, 
  Download, 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Award,
  Layers,
  Flame,
  FileCheck,
  FolderOpen,
  Calendar,
  Eye,
  Check,
  Bookmark,
  Share2,
  HelpCircle,
  Clock,
  Sparkle
} from "lucide-react";

export type BoardType = "CBSE" | "ICSE" | "WBCHSE" | "ENTRANCE";
export type AcademicClassType = "CLASS_XI" | "CLASS_XII";
export type SemesterType = "SEM_1" | "SEM_2" | "SEM_3" | "SEM_4";

export interface StudyMaterialItem {
  id: string;
  section?: string;
  classSem?: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  fileSize?: string;
  isPremium?: boolean;
  category: string;
  discipline: "PHYSICAL" | "INORGANIC" | "ORGANIC" | "GENERAL";
  chapterNumber?: number;
  chapterTitle?: string;
  boardTarget?: string;
  academicLevelTarget?: string;
  createdAt?: string;
}

export interface StudyMaterialRepositoryProps {
  studyMaterials?: any[];
  student?: any;
  basePath?: string;
  initialBoard?: string;
  initialLevel?: string;
  initialCategory?: string;
}

// Chapter metadata mapping for Chemistry
const STANDARD_CHAPTERS: { [key: string]: { num: number; title: string; discipline: "PHYSICAL" | "INORGANIC" | "ORGANIC" | "GENERAL" } } = {
  "atomic": { num: 2, title: "Structure of Atom", discipline: "PHYSICAL" },
  "atom": { num: 2, title: "Structure of Atom", discipline: "PHYSICAL" },
  "periodic": { num: 3, title: "Classification of Elements & Periodicity", discipline: "INORGANIC" },
  "pt": { num: 3, title: "Classification of Elements & Periodicity", discipline: "INORGANIC" },
  "bonding": { num: 4, title: "Chemical Bonding & Molecular Structure", discipline: "INORGANIC" },
  "thermo": { num: 5, title: "Chemical Thermodynamics", discipline: "PHYSICAL" },
  "equilibrium": { num: 6, title: "Chemical & Ionic Equilibrium", discipline: "PHYSICAL" },
  "redox": { num: 7, title: "Redox Reactions", discipline: "PHYSICAL" },
  "s-block": { num: 8, title: "The s-Block Elements", discipline: "INORGANIC" },
  "s block": { num: 8, title: "The s-Block Elements", discipline: "INORGANIC" },
  "p-block": { num: 9, title: "The p-Block Elements (Gr 13 & 14)", discipline: "INORGANIC" },
  "p block": { num: 9, title: "The p-Block Elements (Gr 13 & 14)", discipline: "INORGANIC" },
  "organic": { num: 10, title: "Organic Chemistry: Principles & Techniques", discipline: "ORGANIC" },
  "hydrocarbon": { num: 11, title: "Hydrocarbons", discipline: "ORGANIC" },
  "solid": { num: 1, title: "Solid State Chemistry", discipline: "PHYSICAL" },
  "solution": { num: 2, title: "Solutions & Colligative Properties", discipline: "PHYSICAL" },
  "electro": { num: 3, title: "Electrochemistry", discipline: "PHYSICAL" },
  "kinetic": { num: 4, title: "Chemical Kinetics", discipline: "PHYSICAL" },
  "coordination": { num: 5, title: "Coordination Compounds", discipline: "INORGANIC" },
  "d-block": { num: 6, title: "d- & f-Block Elements", discipline: "INORGANIC" },
  "haloalkane": { num: 7, title: "Haloalkanes & Haloarenes", discipline: "ORGANIC" },
  "alcohol": { num: 8, title: "Alcohols, Phenols & Ethers", discipline: "ORGANIC" },
  "aldehyde": { num: 9, title: "Aldehydes, Ketones & Carboxylic Acids", discipline: "ORGANIC" },
  "amine": { num: 10, title: "Amines & Nitrogen Derivatives", discipline: "ORGANIC" },
  "biomolecule": { num: 11, title: "Biomolecules & Polymers", discipline: "ORGANIC" }
};

export default function StudyMaterialRepository({
  studyMaterials = [],
  student,
  basePath = "/study-material",
  initialBoard,
  initialLevel,
  initialCategory
}: StudyMaterialRepositoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Selected Academic Hierarchy
  const [selectedBoard, setSelectedBoard] = useState<BoardType | null>(() => {
    if (initialBoard) {
      const b = initialBoard.toUpperCase();
      if (b === "CBSE" || b === "ICSE" || b === "WBCHSE" || b === "ENTRANCE") return b as BoardType; if (b.includes("NEET") || b.includes("JEE") || b === "COMPETITIVE") return "ENTRANCE";
    }
    const qBoard = searchParams?.get("board")?.toUpperCase();
    if (qBoard === "CBSE" || qBoard === "ICSE" || qBoard === "WBCHSE" || qBoard === "ENTRANCE") return qBoard as BoardType; if (qBoard && (qBoard.includes("NEET") || qBoard.includes("JEE") || qBoard === "COMPETITIVE")) return "ENTRANCE";
    return null;
  });

  const [selectedLevel, setSelectedLevel] = useState<string | null>(() => {
    if (initialLevel) return initialLevel.toUpperCase();
    const qLevel = searchParams?.get("level")?.toUpperCase();
    return qLevel || null;
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    if (initialCategory) return initialCategory;
    const qCat = searchParams?.get("category");
    return qCat || null;
  });

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDiscipline, setActiveDiscipline] = useState<"ALL" | "PHYSICAL" | "INORGANIC" | "ORGANIC">("ALL");
  const [sortBy, setSortBy] = useState<"CHAPTER" | "RECENT" | "AZ">("CHAPTER");

  // Upgrade Modal State
  const [upgradeItem, setUpgradeItem] = useState<StudyMaterialItem | null>(null);

  // Check Subscription Status
  const isComp = student?.subscriptionStatus === "COMPLIMENTARY";
  const isPaid = student?.subscriptionStatus === "PAID" && (
    !student?.subscriptionExpiresAt || new Date(student?.subscriptionExpiresAt).getTime() > Date.now()
  );
  const isGold = isComp || isPaid;

  // Sync state with URL search params if inside dashboard or standalone
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedBoard) params.set("board", selectedBoard.toLowerCase());
    if (selectedLevel) params.set("level", selectedLevel.toLowerCase());
    if (selectedCategory) params.set("category", selectedCategory);

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Update browser URL silently without full reload
    if (typeof window !== "undefined" && window.location.search !== (queryString ? `?${queryString}` : "")) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [selectedBoard, selectedLevel, selectedCategory, pathname]);

  // Clean and map existing DB study materials (EXCLUDING 3D LABS!)
  const sanitizedMaterials = useMemo<StudyMaterialItem[]>(() => {
    return studyMaterials
      .filter((mat: any) => {
        // STRICT RULE: Remove 3D animations from Study Material repository!
        const is3D = mat.type === "LINK" || mat.category === "3D animations" || (mat.url && mat.url.includes("lab-viewer"));
        return !is3D;
      })
      .map((mat: any) => {
        const titleLower = (mat.title || "").toLowerCase();
        const desc = (mat.cleanDescription || mat.description || "").replace(/<!--[\s\S]*?-->/g, "").trim();

        // Detect Chapter & Discipline
        let chapterNumber = 1;
        let chapterTitle = "Core Curriculum";
        let discipline: "PHYSICAL" | "INORGANIC" | "ORGANIC" | "GENERAL" = mat.discipline || "GENERAL";

        for (const [keyword, meta] of Object.entries(STANDARD_CHAPTERS)) {
          if (titleLower.includes(keyword) || desc.toLowerCase().includes(keyword)) {
            chapterNumber = meta.num;
            chapterTitle = meta.title;
            if (discipline === "GENERAL") {
              discipline = meta.discipline;
            }
            break;
          }
        }

        // Map Category cleanly
        let category = mat.category || "Chapter-wise PDF Notes";
        if (category === "Chapter wise PDF Notes") category = "Chapter-wise PDF Notes";
        if (category === "Daily practice problems (DPPs)") category = "Daily Practice Problems (DPPs)";
        if (category.includes("Prev. 34 Years") || category.includes("Prev. Years")) category = "Previous Year Questions";
        if (category === "Class Exams PDF") category = "Class / School Exams";

        return {
          id: mat.id.startsWith("db-") ? mat.id : "db-" + mat.id,
          title: mat.title,
          description: desc || "Comprehensive study and examination material prepared for your curriculum.",
          type: mat.type || "PDF",
          url: mat.url,
          fileSize: mat.fileSize || "Official PDF",
          isPremium: Boolean(mat.isPremium),
          category,
          discipline,
          chapterNumber,
          chapterTitle,
          section: mat.section || "ALL",
          createdAt: mat.createdAt
        };
      });
  }, [studyMaterials]);

  // Filter materials based on current Board + Class/Semester context
  const contextMaterials = useMemo(() => {
    return sanitizedMaterials.filter(item => {
      // 1. Board / Curriculum filtering
      if (selectedBoard === "WBCHSE") {
        if (item.section && item.section !== "ALL" && item.section !== "WBCHSE") return false;
      } else if (selectedBoard === "CBSE") {
        if (item.section && item.section !== "ALL" && item.section !== "CBSE") return false;
      } else if (selectedBoard === "ICSE") {
        if (item.section && item.section !== "ALL" && item.section !== "ICSE") return false;
      } else if (selectedBoard === "ENTRANCE") {
        if (item.section && item.section !== "ALL" && item.section !== "NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS") return false;
      }

      // 2. Class / Semester filtering
      if (selectedLevel) {
        if (selectedLevel === "CLASS_XI") {
          const isAllowedForClass11 = item.classSem === "11" || item.classSem === "SEM-I" || item.classSem === "SEM-II" || item.classSem === "ALL";
          if (item.classSem && !isAllowedForClass11) return false;
        } else if (selectedLevel === "CLASS_XII") {
          const isAllowedForClass12 = item.classSem === "12" || item.classSem === "SEM-III" || item.classSem === "SEM-IV" || item.classSem === "ALL";
          if (item.classSem && !isAllowedForClass12) return false;
        } else if (selectedLevel === "SEM_1") {
          if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-I") return false;
        } else if (selectedLevel === "SEM_2") {
          if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-II") return false;
        } else if (selectedLevel === "SEM_3") {
          if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-III") return false;
        } else if (selectedLevel === "SEM_4") {
          if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-IV") return false;
        }
      }

      return true;
    });
  }, [sanitizedMaterials, selectedBoard, selectedLevel]);
  // Categories with live count for active context
  const resourceCategories = useMemo(() => {
    const cats = [
      {
        id: "notes",
        name: "CHAPTER-WISE PDF NOTES",
        subtitle: "Theory · Derivations · Formula Bibles",
        description: "Handcrafted master notes with rigorous conceptual clarity and NCERT mapping.",
        icon: BookOpen,
        color: "cyan",
        matchFn: (m: StudyMaterialItem) => m.category.includes("Notes") || m.category.includes("PDF Notes")
      },
      {
        id: "dpp",
        name: "DAILY PRACTICE PROBLEMS (DPPs)",
        subtitle: "Targeted Sets · Answer Keys · Graded Levels",
        description: "Curated question sets for regular concept consolidation and problem mastery.",
        icon: FileCheck,
        color: "amber",
        matchFn: (m: StudyMaterialItem) => m.category.includes("Practice") || m.category.includes("DPP") || m.title.toLowerCase().includes("dpp") || m.title.toLowerCase().includes("qs ans")
      },
      {
        id: "pyq",
        name: "PREVIOUS YEAR QUESTIONS",
        subtitle: "NEET · JEE Mains · WBJEE · Board PYQs",
        description: "Year-wise and chapter-wise authentic solved question archive with answer keys.",
        icon: Award,
        color: "purple",
        matchFn: (m: StudyMaterialItem) => m.category.includes("Previous") || m.title.toLowerCase().includes("neet") || m.title.toLowerCase().includes("jee") || m.title.toLowerCase().includes("wbjee")
      },
      {
        id: "exams",
        name: "CLASS / SCHOOL EXAMS",
        subtitle: "Official Term Tests · Authentic Question Papers",
        description: "Complete terminal exam papers and sample question blueprints.",
        icon: Layers,
        color: "emerald",
        matchFn: (m: StudyMaterialItem) => m.category.includes("Exam") || m.title.toLowerCase().includes("exam") || m.title.toLowerCase().includes("test")
      },
      {
        id: "revision",
        name: "REVISION MATERIAL",
        subtitle: "Quick Mindmaps · Flash Summary Sheets",
        description: "High-yield revision charts designed for rapid review before tests.",
        icon: Sparkles,
        color: "teal",
        matchFn: (m: StudyMaterialItem) => m.title.toLowerCase().includes("revision") || m.title.toLowerCase().includes("quick")
      },
      {
        id: "formula",
        name: "FORMULA & QUICK REFERENCE",
        subtitle: "Reaction Sheets · Formula Compendiums",
        description: "Concise formula reference guides and organic reaction mechanism summaries.",
        icon: FileText,
        color: "blue",
        matchFn: (m: StudyMaterialItem) => m.title.toLowerCase().includes("formula") || m.title.toLowerCase().includes("trend") || m.title.toLowerCase().includes("sheet")
      },
      {
        id: "suggestions",
        name: "SUGGESTION SETS",
        subtitle: "High-Probability Problem Sets · Target 2026",
        description: "Vetted suggestion sets focusing on recurring examination patterns.",
        icon: Flame,
        color: "rose",
        matchFn: (m: StudyMaterialItem) => m.title.toLowerCase().includes("suggestion")
      }
    ];

    return cats.map(cat => {
      const count = contextMaterials.filter(cat.matchFn).length;
      return { ...cat, count };
    });
  }, [contextMaterials]);

  // Active Category Items (for the Resource List view)
  const activeCategoryObject = useMemo(() => {
    if (!selectedCategory) return null;
    return resourceCategories.find(c => c.id === selectedCategory || c.name === selectedCategory) || resourceCategories[0];
  }, [selectedCategory, resourceCategories]);

  const activeCategoryItems = useMemo(() => {
    if (!activeCategoryObject) return [];
    let items = contextMaterials.filter(activeCategoryObject.matchFn);

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item => 
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.chapterTitle && item.chapterTitle.toLowerCase().includes(q))
      );
    }

    // Apply Discipline Filter
    if (activeDiscipline !== "ALL") {
      items = items.filter(item => item.discipline === activeDiscipline);
    }

    // Apply Sorting
    return items.sort((a, b) => {
      if (sortBy === "CHAPTER") {
        return (a.chapterNumber || 99) - (b.chapterNumber || 99);
      }
      if (sortBy === "AZ") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [activeCategoryObject, contextMaterials, searchQuery, activeDiscipline, sortBy]);

  // Format Level Label for Display
  const getBoardLabel = (board: string | null) => {
    if (!board) return "";
    if (board === "ENTRANCE") return "NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS";
    return board;
  };

  const getLevelLabel = (level: string | null) => {
    if (!level) return "";
    switch (level) {
      case "CLASS_XI": return "Class XI";
      case "CLASS_XII": return "Class XII";
      case "SEM_1": return "Semester I";
      case "SEM_2": return "Semester II";
      case "SEM_3": return "Semester III";
      case "SEM_4": return "Semester IV";
      case "NEET": return "NEET UG";
      case "JEE": return "JEE Mains & Adv.";
      case "WBJEE": return "WBJEE Target";
      case "CUET": return "CUET & Other Exams";
      default: return level.replace("_", " ");
    }
  };

  // Reset helpers
  const handleResetBoard = () => {
    setSelectedBoard(null);
    setSelectedLevel(null);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  const handleResetLevel = () => {
    setSelectedLevel(null);
    setSelectedCategory(null);
    setSearchQuery("");
  };

  const handleResetCategory = () => {
    setSelectedCategory(null);
    setSearchQuery("");
  };

  return (
    <div className="w-full text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      
      {/* ============================================================ */}
      {/* 1. SECTION TITLE & BREADCRUMB NAVIGATION                     */}
      {/* ============================================================ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif flex items-center gap-2">
            <span 
              onClick={selectedBoard ? handleResetBoard : undefined}
              className={selectedBoard ? "cursor-pointer hover:text-cyan-300 transition-colors" : ""}
            >
              Study Materials
            </span>
          </h2>

          {selectedBoard && (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-slate-400 bg-transparent py-1">
              <button 
                onClick={handleResetBoard}
                className="hover:text-cyan-300 transition-colors font-semibold text-cyan-400"
              >
                All Curriculums
              </button>
              <span className="text-slate-600">/</span>
              <button 
                onClick={handleResetLevel}
                className={`hover:text-cyan-300 transition-colors uppercase font-semibold ${!selectedLevel ? "text-cyan-400" : "text-slate-400"}`}
              >
                {selectedBoard}
              </button>

              {selectedLevel && (
                <>
                  <span className="text-slate-600">/</span>
                  <button 
                    onClick={handleResetCategory}
                    className={`hover:text-cyan-300 transition-colors uppercase font-semibold ${!selectedCategory ? "text-cyan-400" : "text-slate-400"}`}
                  >
                    {getLevelLabel(selectedLevel)}
                  </button>
                </>
              )}

              {selectedCategory && activeCategoryObject && (
                <>
                  <span className="text-slate-600">/</span>
                  <span className="text-cyan-300 font-bold uppercase truncate max-w-[200px] sm:max-w-none">
                    {activeCategoryObject.name}
                  </span>
                </>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* STEP 1: BOARD SELECTION ("Choose your curriculum")            */}
      {/* ============================================================ */}
      {!selectedBoard && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in zoom-in-98 duration-400">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>PIECHEM ACADEMIC ARCHIVES</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-serif italic">
              Your Chemistry Knowledge Repository
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
              Structured theory, derivations, DPPs, and previous year examination archives engineered for your specific board curriculum.
            </p>
          </div>

          <div className="pt-2">
            <h2 className="text-xs sm:text-sm font-mono tracking-[0.2em] text-slate-400 uppercase text-center mb-6">
              Step 1: Choose your curriculum
            </h2>

            {/* 3 Large Academic Portal Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              
              {/* 1. CBSE */}
              <Link 
                href="/study-material/cbse"
                className="group relative cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/60 p-6 sm:p-8 flex flex-col justify-between min-h-[300px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(0,217,255,0.15)] shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-end">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00D9FF]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight group-hover:text-cyan-300 transition-colors">
                      CBSE
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Central Board of Secondary Education
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-light">
                    Complete NCERT-aligned theory bibles, chapter derivations, competitive bridge problems, and Board exemplary sets.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
                    CLASS XI · CLASS XII
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    <span>Explore Chemistry</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* 2. ICSE / ISC */}
              <Link 
                href="/study-material/icse"
                className="group relative cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-amber-500/20 hover:border-amber-400/60 p-6 sm:p-8 flex flex-col justify-between min-h-[300px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(245,158,11,0.15)] shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-end">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight group-hover:text-amber-300 transition-colors">
                      ICSE / ISC
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Indian Certificate of Secondary Education
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-light">
                    In-depth organic reaction mechanisms, physical derivations, analytical laboratory guides, and Council specimen papers.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
                    CLASS XI · CLASS XII
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                    <span>Explore Chemistry</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* 3. WBCHSE */}
              <Link 
                href="/study-material/wbchse"
                className="group relative cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-emerald-500/20 hover:border-emerald-400/60 p-6 sm:p-8 flex flex-col justify-between min-h-[300px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(16,185,129,0.15)] shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-end">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight group-hover:text-emerald-300 transition-colors">
                      WBCHSE
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      West Bengal Council of Higher Secondary Education
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-light">
                    Newly calibrated Semester I, II, III & IV question patterns, bilingual notes (English & Bengali), and WBJEE high-frequency banks.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
                    SEMESTER I · II · III · IV
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <span>Explore Chemistry</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* 4. NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS */}
              <Link 
                href="/study-material/entrance"
                className="group relative cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-rose-500/20 hover:border-rose-400/60 p-6 sm:p-8 flex flex-col justify-between min-h-[300px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(244,63,94,0.15)] shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-end">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#F43F5E]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight group-hover:text-rose-300 transition-colors leading-tight">
                      NEET / JEE / WBJEE / CUET
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      & Other Entrance Exams
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-light">
                    34-Year chapter-wise solved PYQ archives, high-yield DPP drill banks, NCERT booster formula digests, and national mock papers.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider">
                    NEET · JEE · WBJEE · CUET
                  </span>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 group-hover:text-rose-300 transition-colors">
                    <span>Explore Chemistry</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

            </div>
          </div>

        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 2: CLASS OR SEMESTER SELECTION                          */}
      {/* ============================================================ */}
      {selectedBoard && !selectedLevel && (
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in zoom-in-98 duration-400">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
                Step 2 · Academic Level
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-serif tracking-tight mt-1">
                {selectedBoard === "WBCHSE" ? "Select your semester" : selectedBoard === "ENTRANCE" ? "Select your target examination" : "Select your class"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
                Curriculum: <strong className="text-white uppercase">{getBoardLabel(selectedBoard)}</strong>
              </p>
            </div>

            <button
              onClick={handleResetBoard}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors self-start sm:self-center px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Curriculum</span>
            </button>
          </div>

          {/* If CBSE or ICSE: Show Class XI and Class XII (STRICTLY 2 Cards) */}
          {(selectedBoard === "CBSE" || selectedBoard === "ICSE") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Class XI */}
              <div
                onClick={() => setSelectedLevel("CLASS_XI")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/60 p-8 flex flex-col justify-between min-h-[240px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,217,255,0.15)] shadow-md"
              >
                <div>
                  <span className="text-xs font-mono text-cyan-300/80 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                    FOUNDATION & COMPETITIVE
                  </span>
                  <h3 className="text-3xl font-extrabold text-white font-sans mt-3 group-hover:text-cyan-300 transition-colors">
                    Class XI Chemistry
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-light mt-2">
                    Atomic structure, chemical bonding, thermodynamics, equilibrium, and foundational inorganic principles.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>Enter Class XI Vault</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Class XII */}
              <div
                onClick={() => setSelectedLevel("CLASS_XII")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/60 p-8 flex flex-col justify-between min-h-[240px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(139,92,246,0.15)] shadow-md"
              >
                <div>
                  <span className="text-xs font-mono text-purple-300/80 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30">
                    BOARD & RANK BOOSTER
                  </span>
                  <h3 className="text-3xl font-extrabold text-white font-sans mt-3 group-hover:text-purple-300 transition-colors">
                    Class XII Chemistry
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-light mt-2">
                    Solutions, electrochemistry, kinetics, coordination chemistry, and complete organic reaction roadmaps.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-purple-400">
                  <span>Enter Class XII Vault</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

            </div>
          )}

          {/* If WBCHSE: Show Semester I, II, III, IV (STRICTLY 4 Cards) */}
          {selectedBoard === "WBCHSE" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Semester I */}
              <div
                onClick={() => setSelectedLevel("SEM_1")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(16,185,129,0.15)] shadow-md"
              >
                <div>
                  <span className="text-[11px] font-mono text-emerald-300/80 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                    CLASS 11 · TERM 1
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-2.5 group-hover:text-emerald-300 transition-colors">
                    Semester I
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                    Basic concepts, atomic structure, periodic table and chemical bonding fundamentals.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Open Semester I</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Semester II */}
              <div
                onClick={() => setSelectedLevel("SEM_2")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,217,255,0.15)] shadow-md"
              >
                <div>
                  <span className="text-[11px] font-mono text-cyan-300/80 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                    CLASS 11 · TERM 2
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-2.5 group-hover:text-cyan-300 transition-colors">
                    Semester II
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                    Thermodynamics, equilibrium, redox, and foundational organic hydrocarbons.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>Open Semester II</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Semester III */}
              <div
                onClick={() => setSelectedLevel("SEM_3")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-amber-500/20 hover:border-amber-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(245,158,11,0.15)] shadow-md"
              >
                <div>
                  <span className="text-[11px] font-mono text-amber-300/80 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30">
                    CLASS 12 · TERM 1
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-2.5 group-hover:text-amber-300 transition-colors">
                    Semester III
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                    Solid state, solutions, electrochemistry, and kinetics theory and numerical sets.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Open Semester III</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Semester IV */}
              <div
                onClick={() => setSelectedLevel("SEM_4")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(139,92,246,0.15)] shadow-md"
              >
                <div>
                  <span className="text-[11px] font-mono text-purple-300/80 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30">
                    CLASS 12 · TERM 2
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-2.5 group-hover:text-purple-300 transition-colors">
                    Semester IV
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-1.5 leading-relaxed">
                    d/f block elements, coordination compounds, haloalkanes, aldehydes, and final board papers.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-purple-400">
                  <span>Open Semester IV</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

            </div>
          )}

          {/* If ENTRANCE: Show 4 Examination Tracks */}
          {selectedBoard === "ENTRANCE" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* 1. NEET UG */}
              <div
                onClick={() => setSelectedLevel("NEET")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-rose-500/20 hover:border-rose-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(244,63,94,0.15)] shadow-md"
              >
                <div>
                  <span className="text-xs font-mono text-rose-300/80 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30">
                    MEDICAL ENTRANCE
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-3 group-hover:text-rose-300 transition-colors">
                    NEET UG Chemistry
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-2 leading-relaxed">
                    NCERT line-by-line master drills, 34-year AIPMT/NEET solved sets, high-speed bio-chem revisions.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-rose-400">
                  <span>Open NEET Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* 2. JEE MAINS & ADVANCED */}
              <div
                onClick={() => setSelectedLevel("JEE")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,217,255,0.15)] shadow-md"
              >
                <div>
                  <span className="text-xs font-mono text-cyan-300/80 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">
                    ENGINEERING ENTRANCE
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-3 group-hover:text-cyan-300 transition-colors">
                    JEE Mains & Adv.
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-2 leading-relaxed">
                    Multi-concept physical chemistry derivations, organic mechanism pathways, and NTA question banks.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-cyan-400">
                  <span>Open JEE Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* 3. WBJEE */}
              <div
                onClick={() => setSelectedLevel("WBJEE")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-emerald-500/20 hover:border-emerald-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(16,185,129,0.15)] shadow-md"
              >
                <div>
                  <span className="text-xs font-mono text-emerald-300/80 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">
                    STATE ENGINEERING
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-3 group-hover:text-emerald-300 transition-colors">
                    WBJEE Target
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-2 leading-relaxed">
                    High-frequency calculation drills, category I, II, III previous year questions and speed shortcuts.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Open WBJEE Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* 4. CUET & OTHER ENTRANCES */}
              <div
                onClick={() => setSelectedLevel("CUET")}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-amber-500/20 hover:border-amber-400/60 p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(245,158,11,0.15)] shadow-md"
              >
                <div>
                  <span className="text-xs font-mono text-amber-300/80 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30">
                    ALL ENTRANCE EXAMS
                  </span>
                  <h3 className="text-2xl font-extrabold text-white font-sans mt-3 group-hover:text-amber-300 transition-colors">
                    CUET & Others
                  </h3>
                  <p className="text-xs text-slate-300/80 font-light mt-2 leading-relaxed">
                    Central university entrance papers, state entrance sets, and complete formula bibles.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-bold text-amber-400">
                  <span>Open CUET Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

            </div>
          )}

        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 3: ACADEMIC HUB CATEGORIES (When Class/Semester active) */}
      {/* ============================================================ */}
      {selectedBoard && selectedLevel && !selectedCategory && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-in fade-in zoom-in-98 duration-400">
          
          {/* Top Hero Communicating Active Academic Context */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                  {selectedBoard === "ENTRANCE" ? "ENTRANCE EXAMS" : selectedBoard} · {getLevelLabel(selectedLevel)}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs font-mono text-slate-300">Chemistry Academic Repository</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-serif italic">
                CHEMISTRY Study Repository
              </h1>

              <p className="text-xs sm:text-sm text-slate-300/90 font-light max-w-2xl leading-relaxed">
                Structured notes, practice material, previous questions and exam-focused resources calibrated for {selectedBoard} {getLevelLabel(selectedLevel)} Chemistry.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetLevel}
                className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch {selectedBoard === "WBCHSE" ? "Semester" : selectedBoard === "ENTRANCE" ? "Exam" : "Class"}</span>
              </button>
            </div>
          </div>

          {/* Resource Category Selection: Large Editorial Cards */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs sm:text-sm font-mono tracking-[0.2em] text-slate-400 uppercase">
                Academic Resource Categories
              </h2>
              <span className="text-xs font-mono text-cyan-400">
                {contextMaterials.length} Documents Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {resourceCategories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="group cursor-pointer rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] hover:border-cyan-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,217,255,0.12)] shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                            {cat.name}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400">
                          {cat.subtitle}
                        </p>
                        <p className="text-xs text-slate-300/80 font-light pt-1 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400">
                        {cat.count > 0 ? (
                          <span className="text-cyan-300 font-semibold">{cat.count} Resources Ready</span>
                        ) : (
                          <span className="text-slate-500">Under Curation</span>
                        )}
                      </span>
                      <div className="inline-flex items-center gap-1.5 font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                        <span>Explore {cat.name.split(" ")[0]}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>
      )}

      {/* ============================================================ */}
      {/* STEP 4: RESOURCE LIST PAGE (When a Category is open)         */}
      {/* ============================================================ */}
      {selectedBoard && selectedLevel && selectedCategory && activeCategoryObject && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
          
          {/* Header & Back Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <span>{selectedBoard === "ENTRANCE" ? "ENTRANCE EXAMS" : selectedBoard}</span>
                <span>•</span>
                <span>{getLevelLabel(selectedLevel)}</span>
                <span>•</span>
                <span>{activeCategoryObject.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight mt-1">
                {activeCategoryObject.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
                {activeCategoryObject.subtitle}
              </p>
            </div>

            <button
              onClick={handleResetCategory}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white transition-colors self-start sm:self-center px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Categories</span>
            </button>
          </div>

          {/* Search, Discipline Filter & Sort Toolbar */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
            
            {/* Scoped Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeCategoryObject.name.toLowerCase()}...`}
                className="w-full bg-[#030910] border border-cyan-500/25 focus:border-cyan-400 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Discipline Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-[11px] font-mono text-slate-500 hidden lg:inline mr-1">Discipline:</span>
              {(["ALL", "PHYSICAL", "INORGANIC", "ORGANIC"] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setActiveDiscipline(d)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors ${
                    activeDiscipline === d 
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" 
                      : "text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.06]"
                  }`}
                >
                  {d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#030910] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="CHAPTER">Chapter Order</option>
                <option value="AZ">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Resource Document Cards Grid */}
          {activeCategoryItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {activeCategoryItems.map((item) => {
                const canAccess = !item.isPremium || isGold;

                return (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] hover:border-cyan-500/40 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,217,255,0.1)] shadow-sm"
                  >
                    <div className="space-y-3">
                      {/* Top Badges: Category + Premium / Free */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                          Chapter {String(item.chapterNumber).padStart(2, "0")}
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

                      {/* Title (Dominant Element) */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                          {item.chapterTitle} · {item.discipline}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300/80 font-light leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Card Footer: Metadata + Primary Action */}
                    <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                        <span>PDF</span>
                        <span>•</span>
                        <span>{item.fileSize || "Verified"}</span>
                      </div>

                      {canAccess ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/pdf-viewer/${item.id.replace("db-", "")}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs transition-all shadow-[0_0_12px_rgba(0,217,255,0.25)]"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors"
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
            /* Premium Empty State */
            <div className="py-12 text-center bg-transparent space-y-4 max-w-xl mx-auto my-6">
              <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white font-mono uppercase tracking-wider">
                  CHEMISTRY ARCHIVE UNDER CURATION
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
                  Resources for this academic section ({selectedBoard} {getLevelLabel(selectedLevel)} - {activeCategoryObject.name}) are being prepared by the faculty.
                </p>
              </div>
              <button
                onClick={handleResetCategory}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Choose another section</span>
              </button>
            </div>
          )}

        </section>
      )}

      {/* ============================================================ */}
      {/* PREVIEW & UPGRADE MODAL                                      */}
      {/* ============================================================ */}
      {upgradeItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl bg-gradient-to-b from-[#0c1b2c] to-[#040d16] border border-amber-500/40 p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                PREMIUM ACADEMIC RESOURCE
              </span>
              <h3 className="text-xl font-bold text-white">
                {upgradeItem.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                This chapter resource is reserved for enrolled Piechem Gold / Paid students. Upgrade your subscription or request complimentary batch access.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setUpgradeItem(null)}
                className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono text-slate-300 transition-colors"
              >
                Close
              </button>
              <Link
                href="/dashboard/account"
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Request Gold Access</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
