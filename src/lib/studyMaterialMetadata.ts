export const LIBRARY_CATEGORIES = [
  '3D animations',
  'Chapter wise PDF Notes',
  'Daily practice problems (DPPs)',
  'NEET Prev. 34 Years',
  'JEE (MAINS) Prev. Years',
  'WBJEE Prev. Years',
  'Class Exams PDF'
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
  'NEET/JEE/WBJEE/CUET & OTHER ENTRANCE EXAMS'
] as const;

export type CurriculumSectionType = typeof CURRICULUM_SECTIONS[number];

export const CLASS_SEM_OPTIONS = [
  '11',
  '12',
  'SEM-I',
  'SEM-II',
  'SEM-III',
  'SEM-IV',
  'ALL'
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
  category: string = 'Chapter wise PDF Notes',
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

  let category: LibraryCategoryType = 'Chapter wise PDF Notes';
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

      return { category, discipline, section, classSem, cleanDescription };
    } catch {}
  }

  const lowerTitle = (title || '').toLowerCase();
  const is3D = type === 'LINK' || lowerTitle.includes('3d') || lowerTitle.includes('bonding') || lowerTitle.includes('solid state') || lowerTitle.includes('model');

  if (is3D) {
    category = '3D animations';
  } else if (lowerTitle.includes('dpp') || lowerTitle.includes('practice problem')) {
    category = 'Daily practice problems (DPPs)';
  } else if (lowerTitle.includes('neet') || lowerTitle.includes('34 year') || lowerTitle.includes('aipmt')) {
    category = 'NEET Prev. 34 Years';
  } else if (lowerTitle.includes('jee') || lowerTitle.includes('mains')) {
    category = 'JEE (MAINS) Prev. Years';
  } else if (lowerTitle.includes('wbjee')) {
    category = 'WBJEE Prev. Years';
  } else if (lowerTitle.includes('exam') || lowerTitle.includes('test') || lowerTitle.includes('paper')) {
    category = 'Class Exams PDF';
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
  const studentBoard = (student?.board || "").toUpperCase().trim();
  const studentLevel = (student?.academicLevel || "").toUpperCase().trim();
  const isWbchseStudent = studentBoard === "WBCHSE";
  const isCbseStudent = studentBoard === "CBSE";
  const isIcseStudent = studentBoard === "ICSE" || studentBoard === "ISC";

  const rawSec = (materialSection || "ALL").toUpperCase().trim();
  const rawClassSem = (materialClassSem || "ALL").toUpperCase().trim();
  const normClassSem = normalizeAcademicLevel(rawClassSem);
  const normStudentLevel = normalizeAcademicLevel(studentLevel);

  const isClass11Content = normClassSem === "SEM-I" || normClassSem === "SEM-II" || normClassSem === "11";
  const isClass12Content = normClassSem === "SEM-III" || normClassSem === "SEM-IV" || normClassSem === "12";

  // Board mismatch check
  const isWbchseSec = rawSec === "WBCHSE";
  const isCbseSec = rawSec === "CBSE";
  const isIcseSec = rawSec === "ICSE" || rawSec === "ISC";

  if (isWbchseSec && !isWbchseStudent) {
    return {
      badgeLabel: "WBCHSE ONLY",
      buttonLabel: "Restricted (WBCHSE)",
      targetLabel: "WBCHSE Curriculum",
      reason: `Exclusive to WBCHSE curriculum (Your board: ${studentBoard || "CBSE/ICSE"})`,
      policyTitle: "Board Exclusive",
      policyNote: "This content is prepared exclusively for the West Bengal Higher Secondary Council syllabus."
    };
  }

  if (isCbseSec && !isCbseStudent) {
    return {
      badgeLabel: "CBSE ONLY",
      buttonLabel: "Restricted (CBSE)",
      targetLabel: "CBSE Curriculum",
      reason: `Exclusive to CBSE curriculum (Your board: ${studentBoard || "WBCHSE"})`,
      policyTitle: "Board Exclusive",
      policyNote: "This content is prepared exclusively for the Central Board of Secondary Education syllabus."
    };
  }

  if (isIcseSec && !isIcseStudent) {
    return {
      badgeLabel: "ICSE ONLY",
      buttonLabel: "Restricted (ICSE)",
      targetLabel: "ICSE/ISC Curriculum",
      reason: `Exclusive to ICSE/ISC curriculum (Your board: ${studentBoard || "WBCHSE"})`,
      policyTitle: "Board Exclusive",
      policyNote: "This content is prepared exclusively for the ICSE / ISC board syllabus."
    };
  }

  // 1. If viewing student is CBSE or ICSE: ALWAYS show Class nomenclature
  if (isCbseStudent || isIcseStudent) {
    const boardName = isCbseStudent ? "CBSE" : "ICSE";
    const userClass = normStudentLevel === "12" ? "Class 12" : "Class 11";

    if (isClass11Content) {
      return {
        badgeLabel: "CLASS 11 ONLY",
        buttonLabel: "Restricted (Class 11)",
        targetLabel: `Class 11 (${boardName})`,
        reason: `Reserved for Class 11 students (Your profile: ${userClass})`,
        policyTitle: "Curriculum Policy",
        policyNote: `In accordance with ${boardName} curriculum guidelines, this material is curated exclusively for Class 11 students.`
      };
    }

    if (isClass12Content) {
      return {
        badgeLabel: "CLASS 12 ONLY",
        buttonLabel: "Restricted (Class 12)",
        targetLabel: `Class 12 (${boardName})`,
        reason: `Reserved for Class 12 students (Your profile: ${userClass})`,
        policyTitle: "Curriculum Policy",
        policyNote: `In accordance with ${boardName} curriculum guidelines, this material is curated exclusively for Class 12 students.`
      };
    }

    return {
      badgeLabel: `${rawClassSem} ONLY`,
      buttonLabel: `Restricted (${rawClassSem})`,
      targetLabel: `Class ${rawClassSem}`,
      reason: `Not available for your current class (Your profile: ${userClass})`,
      policyTitle: "Curriculum Policy",
      policyNote: "This resource is mapped to a specific academic level."
    };
  }

  // 2. If viewing student is WBCHSE: ALWAYS show Semester nomenclature
  if (isWbchseStudent) {
    const userSem = normStudentLevel.startsWith("SEM-") ? normStudentLevel : `Sem ${normStudentLevel}`;

    let targetSem = normClassSem;
    if (rawClassSem === "11") targetSem = "SEM-I & II";
    else if (rawClassSem === "12") targetSem = "SEM-III & IV";

    return {
      badgeLabel: `${targetSem} ONLY`,
      buttonLabel: `Restricted (${targetSem})`,
      targetLabel: `WBCHSE ${targetSem}`,
      reason: `Reserved for ${targetSem} students (Your semester: ${userSem})`,
      policyTitle: "Semester Policy",
      policyNote: `In accordance with WBCHSE semester regulations, this material is curated exclusively for ${targetSem} students.`
    };
  }

  // 3. Fallback / Guest / Unknown: Show dual nomenclature if Semester
  if (normClassSem === "SEM-I" || normClassSem === "SEM-II") {
    return {
      badgeLabel: `CLASS 11 / ${normClassSem}`,
      buttonLabel: `Restricted (Class 11 / ${normClassSem})`,
      targetLabel: `Class 11 & WBCHSE ${normClassSem}`,
      reason: `Available for Class 11 and WBCHSE ${normClassSem} students`,
      policyTitle: "Curriculum Policy",
      policyNote: `This content is assigned to Class 11 (CBSE/ICSE) and WBCHSE ${normClassSem}.`
    };
  }

  if (normClassSem === "SEM-III" || normClassSem === "SEM-IV") {
    return {
      badgeLabel: `CLASS 12 / ${normClassSem}`,
      buttonLabel: `Restricted (Class 12 / ${normClassSem})`,
      targetLabel: `Class 12 & WBCHSE ${normClassSem}`,
      reason: `Available for Class 12 and WBCHSE ${normClassSem} students`,
      policyTitle: "Curriculum Policy",
      policyNote: `This content is assigned to Class 12 (CBSE/ICSE) and WBCHSE ${normClassSem}.`
    };
  }

  return {
    badgeLabel: `${rawClassSem} ONLY`,
    buttonLabel: `Restricted (${rawClassSem})`,
    targetLabel: rawClassSem,
    reason: `Reserved for ${rawClassSem} students`,
    policyTitle: "Curriculum Policy",
    policyNote: `This content is restricted to ${rawClassSem}.`
  };
}

export function isStudentEligibleForMaterial(
  student?: StudentAcademicProfile | null,
  materialSection?: string | null,
  materialClassSem?: string | null
): MaterialEligibilityResult {
  const tailored = getTailoredRestrictionDetails(student, materialSection || "ALL", materialClassSem || "ALL");

  if (!student || !student.board || !student.academicLevel) {
    return { 
      eligible: false, 
      ...tailored,
      reason: "Please sign in or complete profile onboarding to access this curriculum material."
    };
  }

  const studentBoard = (student.board || "").toUpperCase().trim();
  const studentLevel = (student.academicLevel || "").toUpperCase().trim();

  const isWbchseStudent = studentBoard === "WBCHSE";
  const isCbseStudent = studentBoard === "CBSE";
  const isIcseStudent = studentBoard === "ICSE" || studentBoard === "ISC";

  const normStudentLevel = normalizeAcademicLevel(studentLevel);

  const rawSec = (materialSection || "ALL").toUpperCase().trim();
  const isAllSec = rawSec === "ALL" || rawSec === "ALL CURRICULUMS";
  const isEntranceSec = rawSec.includes("NEET") || rawSec.includes("JEE") || rawSec.includes("ENTRANCE");
  const isWbchseSec = rawSec === "WBCHSE";
  const isCbseSec = rawSec === "CBSE";
  const isIcseSec = rawSec === "ICSE" || rawSec === "ISC";

  if (!isAllSec && !isEntranceSec) {
    if (isWbchseSec && !isWbchseStudent) {
      return { eligible: false, ...tailored };
    }
    if (isCbseSec && !isCbseStudent) {
      return { eligible: false, ...tailored };
    }
    if (isIcseSec && !isIcseStudent) {
      return { eligible: false, ...tailored };
    }
  }

  const rawClassSem = (materialClassSem || "ALL").toUpperCase().trim();
  const normClassSem = normalizeAcademicLevel(rawClassSem);

  if (rawClassSem === "ALL" || normClassSem === "ALL") {
    return { eligible: true, ...tailored };
  }

  // WBCHSE Student checks
  if (isWbchseStudent) {
    if (normClassSem === "SEM-I" && normStudentLevel === "SEM-I") return { eligible: true, ...tailored };
    if (normClassSem === "SEM-II" && normStudentLevel === "SEM-II") return { eligible: true, ...tailored };
    if (normClassSem === "SEM-III" && normStudentLevel === "SEM-III") return { eligible: true, ...tailored };
    if (normClassSem === "SEM-IV" && normStudentLevel === "SEM-IV") return { eligible: true, ...tailored };

    if (normClassSem === "11" && (normStudentLevel === "SEM-I" || normStudentLevel === "SEM-II" || normStudentLevel === "11")) return { eligible: true, ...tailored };
    if (normClassSem === "12" && (normStudentLevel === "SEM-III" || normStudentLevel === "SEM-IV" || normStudentLevel === "12")) return { eligible: true, ...tailored };

    return { eligible: false, ...tailored };
  }

  // CBSE & ICSE Student checks
  if (isCbseStudent || isIcseStudent) {
    const isClass11Student = normStudentLevel === "11" || normStudentLevel === "SEM-I" || normStudentLevel === "SEM-II";
    const isClass12Student = normStudentLevel === "12" || normStudentLevel === "SEM-III" || normStudentLevel === "SEM-IV";

    if (normClassSem === "SEM-I" || normClassSem === "SEM-II" || normClassSem === "11") {
      if (isClass11Student) return { eligible: true, ...tailored };
      return { eligible: false, ...tailored };
    }

    if (normClassSem === "SEM-III" || normClassSem === "SEM-IV" || normClassSem === "12") {
      if (isClass12Student) return { eligible: true, ...tailored };
      return { eligible: false, ...tailored };
    }

    return { eligible: false, ...tailored };
  }

  if (normClassSem === normStudentLevel) return { eligible: true, ...tailored };
  return { eligible: false, ...tailored };
}
