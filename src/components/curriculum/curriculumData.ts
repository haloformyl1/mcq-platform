"use client";

import { 
  BookOpen, 
  FileCheck, 
  Award, 
  Layers, 
  Sparkles, 
  FileText, 
  Flame,
  LucideIcon
} from "lucide-react";

export type BoardType = "CBSE" | "ICSE" | "WBCHSE" | "ENTRANCE";
export type AcademicClassType = "CLASS_XI" | "CLASS_XII";
export type SemesterType = "SEM_1" | "SEM_2" | "SEM_3" | "SEM_4";
export type EntranceExamType = "NEET" | "JEE" | "WBJEE" | "CUET";

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

export interface ResourceCategoryMeta {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  matchFn: (m: StudyMaterialItem) => boolean;
}

// Chapter metadata mapping for Chemistry
export const STANDARD_CHAPTERS: { [key: string]: { num: number; title: string; discipline: "PHYSICAL" | "INORGANIC" | "ORGANIC" | "GENERAL" } } = {
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

export const RESOURCE_CATEGORIES: ResourceCategoryMeta[] = [
  {
    id: "notes",
    name: "CHAPTER-WISE PDF NOTES",
    subtitle: "Theory · Derivations · Formula Bibles",
    description: "Handcrafted master notes with rigorous conceptual clarity and board syllabus mapping.",
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
    subtitle: "Solved Archives · Answer Keys · Marking Blueprints",
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
    matchFn: (m: StudyMaterialItem) => m.title.toLowerCase().includes("formula") || m.title.toLowerCase().includes("sheet") || m.title.toLowerCase().includes("summary")
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

export function sanitizeMaterials(rawMaterials: any[] = []): StudyMaterialItem[] {
  return rawMaterials
    .filter((mat: any) => {
      const is3D = mat.type === "LINK" || mat.category === "3D animations" || (mat.url && mat.url.includes("lab-viewer"));
      return !is3D;
    })
    .map((mat: any) => {
      const titleLower = (mat.title || "").toLowerCase();
      const desc = (mat.cleanDescription || mat.description || "").replace(/<!--[\s\S]*?-->/g, "").trim();

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

      let category = mat.category || "Chapter-wise PDF Notes";
      if (category === "Chapter wise PDF Notes") category = "Chapter-wise PDF Notes";
      if (category === "Daily practice problems (DPPs)") category = "Daily Practice Problems (DPPs)";
      if (category.includes("Prev. 34 Years") || category.includes("Prev. Years")) category = "Previous Year Questions";
      if (category === "Class Exams PDF") category = "Class / School Exams";

      return {
        id: mat.id?.startsWith("db-") ? mat.id : "db-" + (mat.id || Math.random()),
        title: mat.title || "Untitled Material",
        description: desc || "Comprehensive study and examination material prepared for your curriculum.",
        type: mat.type || "PDF",
        url: mat.url || "",
        fileSize: mat.fileSize || "Official PDF",
        isPremium: Boolean(mat.isPremium),
        category,
        discipline,
        chapterNumber,
        chapterTitle,
        section: mat.section || "ALL",
        classSem: mat.classSem || "ALL",
        createdAt: mat.createdAt
      };
    });
}

export function filterMaterialsForContext(
  materials: StudyMaterialItem[],
  board: BoardType | string | null,
  level: string | null = null
): StudyMaterialItem[] {
  return materials.filter(item => {
    // 1. Board / Curriculum filtering
    if (board) {
      const b = board.toUpperCase();
      if (b === "WBCHSE") {
        if (item.section && item.section !== "ALL" && item.section !== "WBCHSE") return false;
      } else if (b === "CBSE") {
        if (item.section && item.section !== "ALL" && item.section !== "CBSE") return false;
      } else if (b === "ICSE") {
        if (item.section && item.section !== "ALL" && item.section !== "ICSE") return false;
      } else if (b === "ENTRANCE" || b === "COMPETITIVE" || b.includes("NEET") || b.includes("JEE")) {
        if (item.section && item.section !== "ALL" && item.section !== "NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS") return false;
      }
    }

    // 2. Class / Semester / Exam filtering
    if (level) {
      const lvl = level.toUpperCase().replace("-", "_");
      if (lvl === "CLASS_XI" || lvl === "11") {
        if (item.classSem && item.classSem !== "ALL" && item.classSem !== "11") return false;
      } else if (lvl === "CLASS_XII" || lvl === "12") {
        if (item.classSem && item.classSem !== "ALL" && item.classSem !== "12") return false;
      } else if (lvl === "SEM_1" || lvl === "SEM_I") {
        if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-I") return false;
      } else if (lvl === "SEM_2" || lvl === "SEM_II") {
        if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-II") return false;
      } else if (lvl === "SEM_3" || lvl === "SEM_III") {
        if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-III") return false;
      } else if (lvl === "SEM_4" || lvl === "SEM_IV") {
        if (item.classSem && item.classSem !== "ALL" && item.classSem !== "SEM-IV") return false;
      }
    }

    return true;
  });
}

export function formatLevelLabel(level: string | null): string {
  if (!level) return "";
  const clean = level.toUpperCase().replace("-", "_");
  switch (clean) {
    case "CLASS_XI":
    case "11":
      return "Class XI";
    case "CLASS_XII":
    case "12":
      return "Class XII";
    case "SEM_1":
    case "SEM_I":
      return "Semester I";
    case "SEM_2":
    case "SEM_II":
      return "Semester II";
    case "SEM_3":
    case "SEM_III":
      return "Semester III";
    case "SEM_4":
    case "SEM_IV":
      return "Semester IV";
    case "NEET":
      return "NEET UG";
    case "JEE":
      return "JEE Mains & Adv.";
    case "WBJEE":
      return "WBJEE Target";
    case "CUET":
      return "CUET & Other Exams";
    default:
      return level.replace(/[-_]/g, " ").toUpperCase();
  }
}
