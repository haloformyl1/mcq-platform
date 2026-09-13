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
    const materials = await prisma.studyMaterial.findMany({ take: 50 });
    const qLower = query.toLowerCase();

    const matches: RetrievedMaterial[] = [];

    for (const mat of materials) {
      const { category, discipline, cleanDescription } = parseMaterialMetadata(mat.description);
      const titleLower = mat.title.toLowerCase();
      const descLower = (cleanDescription || mat.description || '').toLowerCase();

      // Check keyword overlap
      const words = qLower.split(/\s+/).filter(w => w.length > 3);
      const matchesTitle = words.some(w => titleLower.includes(w));
      const matchesDesc = words.some(w => descLower.includes(w));
      const matchesCategory = words.some(w => category.toLowerCase().includes(w));

      if (matchesTitle || matchesDesc || matchesCategory || words.length === 0) {
        matches.push({
          id: mat.id,
          title: mat.title,
          description: cleanDescription || mat.description || '',
          type: mat.type,
          url: mat.url,
          category,
          discipline,
          sourceCitation: `PIECHEM → Chemistry → ${category} → ${mat.title}`
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
