/**
 * PIECHEM Material Retriever & Knowledge Grounding
 * Grounding AI answers in authentic PIECHEM study materials and question bank.
 */

import prisma from "@/lib/prisma";
import { parseMaterialMetadata } from "@/lib/studyMaterialMetadata";

export interface RetrievedMaterial {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  category: string;
  discipline: string;
  sourceCitation: string;
}

export async function retrieveRelevantPiechemMaterials(query: string): Promise<RetrievedMaterial[]> {
  try {
    if (!query || !query.trim()) return [];

    const materials = await prisma.studyMaterial.findMany({ take: 50 });
    const qLower = query.toLowerCase();

    const matches: RetrievedMaterial[] = [];
    const stopWords = new Set([
      'what', 'when', 'where', 'which', 'who', 'whom', 'this', 'that', 'with', 'from', 'have', 
      'more', 'give', 'tell', 'show', 'explain', 'please', 'about', 'notes', 'note', 'piechem', 
      'according', 'study', 'material', 'materials', 'pdf', 'chapter', 'academic', 'science', 
      'classified', 'question', 'questions', 'test'
    ]);
    const words = qLower.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !stopWords.has(w));

    if (words.length === 0) return [];

    for (const mat of materials) {
      const { category, discipline, cleanDescription } = parseMaterialMetadata(mat.description);
      const titleLower = mat.title.toLowerCase();
      const descLower = (cleanDescription || mat.description || '').toLowerCase();
      const categoryLower = category.toLowerCase();

      // Check genuine keyword overlap
      const matchesTitle = words.some(w => titleLower.includes(w));
      const matchesDesc = words.some(w => descLower.includes(w));
      // Match strictly on genuine academic title or description content (avoid generic category meta-matching)
      if (matchesTitle || matchesDesc) {
        matches.push({
          id: mat.id,
          title: mat.title,
          description: cleanDescription || mat.description || '',
          type: mat.type,
          url: mat.url,
          category,
          discipline,
          sourceCitation: `PIECHEM → ${discipline || 'Academic'} → ${category || 'Curriculum'} → ${mat.title}`
        });
      }
    }

    return matches.slice(0, 5);
  } catch (err) {
    console.warn('Material retrieval error:', err);
    return [];
  }
}

export async function retrieveRelevantVaultQuestions(chapterOrTopic: string, limit = 5) {
  try {
    if (!chapterOrTopic || !chapterOrTopic.trim()) return [];

    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { category: { contains: chapterOrTopic, mode: 'insensitive' } },
          { questionText: { contains: chapterOrTopic, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        correctAnswer: true,
        explanation: true,
        difficulty: true,
        category: true
      }
    });

    return questions;
  } catch (err) {
    console.warn('Question vault retrieval error:', err);
    return [];
  }
}
