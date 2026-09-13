/**
 * PIECHEM Post-Exam Performance Diagnostic Engine
 * Generates comprehensive academic performance reports from real student test attempt data.
 */

import prisma from "@/lib/prisma";
import { PerformanceReport, Language } from "./types";
import { callGemini } from "./geminiClient";
import { cleanJsonOutput } from "./validators";

export async function generatePerformanceReport(params: {
  attemptId: string;
  language?: Language;
  userApiKey?: string;
}): Promise<PerformanceReport | null> {
  const { attemptId, language = "en", userApiKey } = params;

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      answers: {
        include: {
          question: true
        }
      }
    }
  });

  if (!attempt) return null;

  const testTitle = attempt.test?.title || "Chemistry Examination";
  const score = attempt.score || 0;
  const percentage = attempt.percentage || 0;
  const totalQuestions = attempt.answers.length;
  const correctCount = attempt.answers.filter(a => a.isCorrect).length;
  const incorrectCount = attempt.answers.filter(a => a.selectedAnswer && !a.isCorrect).length;
  const unansweredCount = attempt.answers.filter(a => !a.selectedAnswer).length;

  // Aggregate category / chapter performance
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  const incorrectAnswers = attempt.answers.filter(a => a.selectedAnswer && !a.isCorrect);

  for (const ans of attempt.answers) {
    const cat = ans.question?.category || "Chemistry";
    if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
    categoryStats[cat].total++;
    if (ans.isCorrect) categoryStats[cat].correct++;
  }

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];

  for (const [cat, stats] of Object.entries(categoryStats)) {
    const acc = Math.round((stats.correct / stats.total) * 100);
    if (acc >= 70) strongTopics.push(cat);
    else weakTopics.push(cat);
  }

  if (weakTopics.length === 0 && strongTopics.length > 0) {
    weakTopics.push("Advanced HOTS Application Questions");
  }

  // Generate conceptual traps for incorrect answers
  const traps = incorrectAnswers.slice(0, 5).map((ans, idx) => {
    const q = ans.question;
    return {
      questionIndex: idx + 1,
      questionText: q.questionText,
      selectedAnswer: ans.selectedAnswer || 'None',
      correctAnswer: q.correctAnswer,
      trapReason: language === 'bn'
        ? `বিকল্প ${ans.selectedAnswer} হলো একটি সাধারণ বিভ্রান্তিকর বিকল্প (Distractor trap)। প্রশ্নটির মূল শর্ত না দেখে তাড়াহুড়ো করার কারণে এই ভুলটি হয়েছে।`
        : `Option ${ans.selectedAnswer} is a common distractor trap. It is easily chosen when misinterpreting reaction conditions or intermediate stability.`,
      remedy: language === 'bn'
        ? `সঠিক বিকল্প ${q.correctAnswer} বেছে নেওয়ার জন্য সর্বদা সমতাকরণ ও রাসায়নিক নিয়মের প্রয়োগ নিশ্চিত করুন।`
        : `To select Option ${q.correctAnswer}, verify electron configurations and fundamental thermodynamic constraints before confirming.`
    };
  });

  const isUrgent = percentage < 50;
  const priorityLevel = isUrgent ? 'URGENT' : percentage < 75 ? 'RECOMMENDED' : 'MAINTENANCE';

  const overallEvaluation = language === 'bn'
    ? `পরীক্ষায় আপনার সার্বিক স্কোর ${score} (${percentage}%)। আপনি ${totalQuestions}-টি প্রশ্নের মধ্যে ${correctCount}-টি সঠিক এবং ${incorrectCount}-টি ভুল করেছেন। ${weakTopics.join(', ')}-এ আরও অনুশীলনের প্রয়োজন।`
    : `Overall performance: ${score} marks (${percentage}%). You achieved ${correctCount} correct answers out of ${totalQuestions} questions with ${incorrectCount} errors. Focused revision in ${weakTopics.join(', ')} is advised.`;

  return {
    attemptId,
    testTitle,
    score,
    percentage,
    totalQuestions,
    correctCount,
    incorrectCount,
    unansweredCount,
    overallEvaluation,
    strongTopics: strongTopics.length > 0 ? strongTopics : ["Basic Concepts"],
    weakTopics: weakTopics.length > 0 ? weakTopics : ["Speed & Calculation Nuances"],
    conceptualTrapsIdentified: traps,
    recommendedRevision: {
      chapters: weakTopics,
      topics: weakTopics,
      priorityLevel,
      suggestedRecoveryQuizQuestions: isUrgent ? 10 : 5
    },
    language
  };
}
