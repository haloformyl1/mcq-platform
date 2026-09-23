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
  // Strip any existing meta tag first
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
    if (currentSec === 'WBCHSE') {
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

      // If parsed didn't have section, fallback auto-detect section
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

  // Fallback auto-detection if no explicit tag is present
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