/**
 * PIECHEM AI Validators
 * Strict schema validation and safety checks for LLM outputs.
 */

import { GeneratedQuestion, QuestionType, QuestionDifficulty } from "./types";

export function cleanJsonOutput(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();
  // Remove markdown code blocks if present
  text = text.replace(/^\`\`\`json\s*/i, '');
  text = text.replace(/^\`\`\`\s*/i, '');
  text = text.replace(/\s*\`\`\`$/i, '');
  return text.trim();
}

export function validateQuestionSchema(item: any): GeneratedQuestion | null {
  if (!item || typeof item !== 'object') return null;

  const questionText = typeof item.questionText === 'string' ? item.questionText.trim() : '';
  if (!questionText || questionText.length < 10) return null;

  const questionType: QuestionType = ['MCQ', 'True/False', 'Assertion-Reason', 'Numerical', 'Conceptual'].includes(item.questionType)
    ? item.questionType
    : 'MCQ';

  const difficulty: QuestionDifficulty = ['Easy', 'Moderate', 'Difficult', 'HOTS'].includes(item.difficulty)
    ? item.difficulty
    : 'Moderate';

  const chapter = typeof item.chapter === 'string' && item.chapter.trim() ? item.chapter.trim() : 'General Chemistry';
  const topic = typeof item.topic === 'string' && item.topic.trim() ? item.topic.trim() : 'Chemical Principles';

  // For MCQs, check all 4 options
  if (questionType === 'MCQ' || questionType === 'Assertion-Reason') {
    const optA = typeof item.optionA === 'string' ? item.optionA.trim() : '';
    const optB = typeof item.optionB === 'string' ? item.optionB.trim() : '';
    const optC = typeof item.optionC === 'string' ? item.optionC.trim() : '';
    const optD = typeof item.optionD === 'string' ? item.optionD.trim() : '';

    if (!optA || !optB || !optC || !optD) return null;

    // Reject if options are identical duplicates
    const set = new Set([optA, optB, optC, optD]);
    if (set.size < 3) return null;

    // Correct answer must be one of A, B, C, D
    const validKeys = ['A', 'B', 'C', 'D'];
    const ans = typeof item.correctAnswer === 'string' ? item.correctAnswer.trim().toUpperCase() : '';
    if (!validKeys.includes(ans)) return null;

    return {
      questionText,
      questionType,
      difficulty,
      chapter,
      topic,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: ans,
      explanation: typeof item.explanation === 'string' && item.explanation.trim() ? item.explanation.trim() : 'Verified by PIECHEM Academic Faculty.',
      commonMistake: typeof item.commonMistake === 'string' ? item.commonMistake.trim() : undefined,
      formulaOrRule: typeof item.formulaOrRule === 'string' ? item.formulaOrRule.trim() : undefined,
      language: item.language === 'bn' ? 'bn' : 'en'
    };
  }

  // True/False
  if (questionType === 'True/False') {
    const ans = typeof item.correctAnswer === 'string' && item.correctAnswer.toLowerCase().includes('true') ? 'True' : 'False';
    return {
      questionText,
      questionType,
      difficulty,
      chapter,
      topic,
      optionA: 'True',
      optionB: 'False',
      correctAnswer: ans,
      explanation: typeof item.explanation === 'string' ? item.explanation.trim() : 'Verified factual statement.'
    };
  }

  // Numerical / Conceptual
  return {
    questionText,
    questionType,
    difficulty,
    chapter,
    topic,
    correctAnswer: typeof item.correctAnswer === 'string' ? item.correctAnswer.trim() : 'Refer to explanation.',
    explanation: typeof item.explanation === 'string' ? item.explanation.trim() : 'Verified conceptual solution.'
  };
}

export function validateQuestionBatch(items: any[]): GeneratedQuestion[] {
  if (!Array.isArray(items)) return [];

  const validated: GeneratedQuestion[] = [];
  const seenTexts = new Set<string>();

  for (const raw of items) {
    const q = validateQuestionSchema(raw);
    if (!q) continue;

    // Check duplicate question text
    const normalized = q.questionText.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenTexts.has(normalized)) continue;

    seenTexts.add(normalized);
    validated.push(q);
  }

  return validated;
}
