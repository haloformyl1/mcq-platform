export type LibraryCategory = 
  | 'ALL'
  | '3D animations'
  | 'Chapter wise PDF Notes'
  | 'Daily practice problems (DPPs)'
  | 'NEET Prev. 34 Years'
  | 'JEE (MAINS) Prev. Years'
  | 'WBJEE Prev. Years'
  | 'Class Exams PDF';

export type SubjectDiscipline = 'ALL' | 'PHYSICAL' | 'INORGANIC' | 'ORGANIC';

export interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  category: Exclude<LibraryCategory, 'ALL'>;
  discipline: 'PHYSICAL' | 'INORGANIC' | 'ORGANIC' | 'GENERAL';
  chapter?: string;
  badgeText: string;
  fileSize?: string;
  url: string;
  isPremium?: boolean;
  pagesOrCount?: string;
  targetExam?: string;
  year?: string;
  isFromDb?: boolean;
}

// Strictly empty: All content is dynamically managed by Admin
export const CURATED_LIBRARY_DATA: LibraryItem[] = [];
