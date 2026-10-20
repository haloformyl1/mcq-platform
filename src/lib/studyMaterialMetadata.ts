export const LIBRARY_CATEGORIES = [
  '3D animations',
  'Chapter-wise PDF Notes',
  'Daily Practice Problems (DPPs)',
  'Previous Year Questions',
  'Class / School Exams',
  'Revision Material',
  'Formula & Quick Reference',
  'Suggestion Sets'
] as const;

export type LibraryCategoryType = typeof LIBRARY_CATEGORIES[number];

export const SUBJECT_DISCIPLINES = [
  'PHYSICAL',
  'INORGANIC',
  'ORGANIC',
  'GENERAL'
] as const;

export type SubjectDisciplineType = typeof SUBJECT_DISCIPLINES[number];

export const CURRICULUM_SECTIONS = [
  'ALL',
  'CBSE',
  'ICSE',
  'WBCHSE',
  'NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS',
  '3D_ANIMATION'
] as const;

export type CurriculumSectionType = typeof CURRICULUM_SECTIONS[number];

export const CLASS_SEM_OPTIONS = [
  '11',
  '12',
  'SEM-I',
  'SEM-II',
  'SEM-III',
  'SEM-IV',
  'NEET',
  'JEE',
  'WBJEE',
  'CUET',
  'ALL',
  'ALL_11',
  'ALL_12'
] as const;

export type ClassSemType = typeof CLASS_SEM_OPTIONS[number];

export interface ParsedMaterialMeta {
  category: LibraryCategoryType;
  discipline: SubjectDisciplineType;
  section: CurriculumSectionType;
  classSem: ClassSemType;
  cleanDescription: string;
}

const META_TAG_REGEX = /<!--\s*piechem-meta:\s*(\{[\s\S]*?\})\s*-->\r?\n?/;

export function encodeMaterialMetadata(
  description: string = '',
  category: string = 'Chapter-wise PDF Notes',
  discipline: string = 'GENERAL',
  section: string = 'ALL',
  classSem: string = 'ALL'
): string {
  const clean = description.replace(META_TAG_REGEX, '').trim();
  const metaObj = { category, discipline, section, classSem };
  const tag = `<!-- piechem-meta: ${JSON.stringify(metaObj)} -->`;
  return clean ? `${tag}\n${clean}` : tag;
}

export function parseMaterialMetadata(
  rawDescription: string | null | undefined,
  title: string = '',
  type: string = 'PDF'
): ParsedMaterialMeta {
  const text = rawDescription || '';
  const match = text.match(META_TAG_REGEX);

  let category: LibraryCategoryType = 'Chapter-wise PDF Notes';
  let discipline: SubjectDisciplineType = 'GENERAL';
  let section: CurriculumSectionType = 'ALL';
  let classSem: ClassSemType = 'ALL';
  let cleanDescription = text;

  const detectClassSem = (str: string, currentSec: CurriculumSectionType): ClassSemType => {
    const s = str.toLowerCase();
    if (s.includes('sem-1') || s.includes('sem 1') || s.includes('sem-i') || s.includes('sem i') || s.includes('semester 1') || s.includes('term 1')) {
      return 'SEM-I';
    }
    if (s.includes('sem-2') || s.includes('sem 2') || s.includes('sem-ii') || s.includes('sem ii') || s.includes('semester 2') || s.includes('term 2')) {
      return 'SEM-II';
    }
    if (s.includes('sem-3') || s.includes('sem 3') || s.includes('sem-iii') || s.includes('sem iii') || s.includes('semester 3') || s.includes('term 3')) {
      return 'SEM-III';
    }
    if (s.includes('sem-4') || s.includes('sem 4') || s.includes('sem-iv') || s.includes('sem iv') || s.includes('semester 4') || s.includes('term 4')) {
      return 'SEM-IV';
    }
    if (s.includes('class 11') || s.includes('class xi') || s.includes('xi') || s.includes('11th')) {
      return '11';
    }
    if (s.includes('class 12') || s.includes('class xii') || s.includes('xii') || s.includes('12th')) {
      return '12';
    }
    if (currentSec === 'WBCHSE' || currentSec === 'ALL') {
      return 'SEM-I';
    }
    if (currentSec === 'CBSE' || currentSec === 'ICSE') {
      return '11';
    }
    return 'ALL';
  };

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.category && (LIBRARY_CATEGORIES as readonly string[]).includes(parsed.category)) {
        category = parsed.category;
      }
      if (parsed.discipline && (SUBJECT_DISCIPLINES as readonly string[]).includes(parsed.discipline)) {
        discipline = parsed.discipline;
      }
      if (parsed.section) {
        if ((CURRICULUM_SECTIONS as readonly string[]).includes(parsed.section)) {
          section = parsed.section;
        } else if (parsed.section === 'NEET_JEE' || parsed.section === 'ENTRANCE' || parsed.section.includes('NEET') || parsed.section.includes('JEE')) {
          section = 'NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS';
        } else if (parsed.section === 'ISC') {
          section = 'ICSE';
        }
      }

      // STRICT VALIDATION: Only LINK types can be 3D animations
      if (category === '3D animations' && type !== 'LINK') {
        category = 'Chapter-wise PDF Notes';
      }
      cleanDescription = text.replace(META_TAG_REGEX, '').trim();

      if (!parsed.section) {
        const lowerTitle = (title || '').toLowerCase();
        const lowerDesc = cleanDescription.toLowerCase();
        if (lowerTitle.includes('wbchse') || lowerDesc.includes('wbchse') || lowerTitle.includes('sem-') || lowerTitle.includes('semester')) {
          section = 'WBCHSE';
        } else if (lowerTitle.includes('neet') || lowerTitle.includes('jee') || lowerTitle.includes('wbjee') || lowerTitle.includes('cuet') || lowerTitle.includes('34 year') || lowerTitle.includes('aipmt') || category.includes('NEET') || category.includes('JEE') || category.includes('WBJEE')) {
          section = 'NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS';
        } else if (lowerTitle.includes('icse') || lowerTitle.includes('isc') || lowerDesc.includes('icse') || lowerDesc.includes('isc')) {
          section = 'ICSE';
        } else if (lowerTitle.includes('cbse') || lowerTitle.includes('ncert') || lowerDesc.includes('cbse')) {
          section = 'CBSE';
        }
      }

      if (parsed.classSem && (CLASS_SEM_OPTIONS as readonly string[]).includes(parsed.classSem)) {
        classSem = parsed.classSem;
      } else {
        classSem = detectClassSem(`${title} ${cleanDescription}`, section);
      }

      // STRICT VALIDATION: Only LINK types can be 3D animations
      if (category === '3D animations' && type !== 'LINK') {
        category = 'Chapter-wise PDF Notes';
      }

      // Automatically fix legacy 3D animations to have the correct curriculum section
      if (category === '3D animations') {
        section = '3D_ANIMATION';
      }

      return { category, discipline, section, classSem, cleanDescription };
    } catch {}
  }

  const lowerTitle = (title || '').toLowerCase();
  const is3D = type === 'LINK' && (lowerTitle.includes('3d') || lowerTitle.includes('bonding') || lowerTitle.includes('solid state') || lowerTitle.includes('model'));

  if (is3D) {
    category = '3D animations';
  } else if (lowerTitle.includes('dpp') || lowerTitle.includes('practice problem')) {
    category = 'Daily Practice Problems (DPPs)';
  } else if (lowerTitle.includes('neet') || lowerTitle.includes('34 year') || lowerTitle.includes('aipmt')) {
    category = 'Previous Year Questions';
  } else if (lowerTitle.includes('jee') || lowerTitle.includes('mains')) {
    category = 'Previous Year Questions';
  } else if (lowerTitle.includes('wbjee')) {
    category = 'Previous Year Questions';
  } else if (lowerTitle.includes('exam') || lowerTitle.includes('test') || lowerTitle.includes('paper')) {
    category = 'Class / School Exams';
  }

  if (lowerTitle.includes('solid') || lowerTitle.includes('solution') || lowerTitle.includes('thermo') || lowerTitle.includes('kinetic') || lowerTitle.includes('electro')) {
    discipline = 'PHYSICAL';
  } else if (lowerTitle.includes('bonding') || lowerTitle.includes('block') || lowerTitle.includes('coordination') || lowerTitle.includes('periodic')) {
    discipline = 'INORGANIC';
  } else if (lowerTitle.includes('organic') || lowerTitle.includes('aldehyde') || lowerTitle.includes('sn1') || lowerTitle.includes('sn2') || lowerTitle.includes('hydrocarbon')) {
    discipline = 'ORGANIC';
  }

  if (lowerTitle.includes('wbchse') || lowerTitle.includes('sem-') || lowerTitle.includes('semester')) {
    section = 'WBCHSE';
  } else if (lowerTitle.includes('neet') || lowerTitle.includes('jee') || lowerTitle.includes('wbjee') || lowerTitle.includes('cuet') || lowerTitle.includes('34 year') || lowerTitle.includes('aipmt') || category.includes('NEET') || category.includes('JEE') || category.includes('WBJEE')) {
    section = 'NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS';
  } else if (lowerTitle.includes('icse') || lowerTitle.includes('isc')) {
    section = 'ICSE';
  } else if (lowerTitle.includes('cbse') || lowerTitle.includes('ncert')) {
    section = 'CBSE';
  }

  classSem = detectClassSem(`${title} ${cleanDescription}`, section);

  // STRICT VALIDATION: Only LINK types can be 3D animations
  if (category === '3D animations' && type !== 'LINK') {
    category = 'Chapter-wise PDF Notes';
  }

  // Automatically fix legacy 3D animations to have the correct curriculum section
  if (category === '3D animations') {
    section = '3D_ANIMATION';
  }

  return { category, discipline, section, classSem, cleanDescription: cleanDescription.trim() };
}

export interface StudentAcademicProfile {
  board?: string | null;
  academicLevel?: string | null;
}

export interface MaterialEligibilityResult {
  eligible: boolean;
  reason?: string;
  badgeLabel?: string;
  buttonLabel?: string;
  targetLabel?: string;
  policyTitle?: string;
  policyNote?: string;
}

export function normalizeAcademicLevel(level?: string | null): string {
  const s = (level || "").toUpperCase().trim().replace(/_/g, "-").replace(/\s+/g, "-");
  if (s.includes("SEM-4") || s.includes("SEM-IV") || s === "IV") return "SEM-IV";
  if (s.includes("SEM-3") || s.includes("SEM-III") || s === "III") return "SEM-III";
  if (s.includes("SEM-2") || s.includes("SEM-II") || s === "II") return "SEM-II";
  if (s.includes("SEM-1") || s.includes("SEM-I") || s === "I") return "SEM-I";
  if (s.includes("12") || s.includes("XII")) return "12";
  if (s.includes("11") || s.includes("XI")) return "11";
  return s;
}

export function formatTargetLabel(section: string = "ALL", classSem: string = "ALL"): string {
  const sec = (section || "ALL").toUpperCase().trim();
  const sem = (classSem || "ALL").toUpperCase().trim();
  const normSem = normalizeAcademicLevel(sem);

  if (sec === "ALL" || sec === "ALL CURRICULUMS") {
    if (normSem === "SEM-I") return "WBCHSE SEM-I & Class 11 (CBSE/ICSE)";
    if (normSem === "SEM-II") return "WBCHSE SEM-II & Class 11 (CBSE/ICSE)";
    if (normSem === "SEM-III") return "WBCHSE SEM-III & Class 12 (CBSE/ICSE)";
    if (normSem === "SEM-IV") return "WBCHSE SEM-IV & Class 12 (CBSE/ICSE)";
    if (normSem === "11") return "Class 11 / SEM-I & II";
    if (normSem === "12") return "Class 12 / SEM-III & IV";
    return "All Curriculums";
  }

  if (sec === "WBCHSE") {
    return normSem === "ALL" ? "WBCHSE (All Semesters)" : `WBCHSE ${normSem}`;
  }

  if (sec === "CBSE") {
    return normSem === "ALL" ? "CBSE (Class 11 & 12)" : `CBSE Class ${normSem}`;
  }

  if (sec === "ICSE" || sec === "ISC") {
    return normSem === "ALL" ? "ICSE/ISC (Class 11 & 12)" : `ICSE Class ${normSem}`;
  }

  return `${sec} (${sem})`;
}

/**
 * Returns tailored restriction text matching the student's exact board nomenclature:
 * - WBCHSE students see Semester terminology (SEM-I, SEM-II, SEM-III, SEM-IV)
 * - CBSE & ICSE students see Class terminology (Class 11, Class 12)
 */
export function getTailoredRestrictionDetails(
  student?: StudentAcademicProfile | null,
  materialSection: string = "ALL",
  materialClassSem: string = "ALL"
): {
  badgeLabel: string;
  buttonLabel: string;
  targetLabel: string;
  reason: string;
  policyTitle: string;
  policyNote: string;
} {
  const rawSec = (materialSection || "ALL").toUpperCase().trim();
  const rawClassSem = (materialClassSem || "ALL").toUpperCase().trim();
  const normClassSem = normalizeAcademicLevel(rawClassSem);

  let label = rawSec === "ALL" ? "" : rawSec;
  if (normClassSem !== "ALL") {
    label = label ? `${label} · ${normClassSem}` : normClassSem;
  }
  if (!label) label = "ALL CURRICULUMS";

  return {
    badgeLabel: label,
    buttonLabel: "View Resource",
    targetLabel: label,
    reason: "",
    policyTitle: "Universal Chemistry Access",
    policyNote: "This study resource is available across all boards and academic levels."
  };
}

export function isStudentEligibleForMaterial(
  student?: StudentAcademicProfile | null,
  materialSection?: string | null,
  materialClassSem?: string | null
): MaterialEligibilityResult {
  const tailored = getTailoredRestrictionDetails(student, materialSection || "ALL", materialClassSem || "ALL");

  if (!student) {
    return { 
      eligible: false, 
      ...tailored,
      reason: "Please sign in to access this curriculum material."
    };
  }

  // Universal curriculum access: All free and premium contents are cross-accessible to all boards and classes!
  return {
    eligible: true,
    ...tailored,
    reason: undefined
  };
}
