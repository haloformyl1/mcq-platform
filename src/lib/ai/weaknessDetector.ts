/**
 * PIECHEM Deterministic Weakness & Mastery Detection Engine
 * Computes authentic learning profiles and mastery scores directly from database attempt records.
 */

import prisma from "@/lib/prisma";
import { StudentLearningProfile, TopicMastery } from "./types";

export async function computeStudentLearningProfile(studentId: string): Promise<StudentLearningProfile> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      board: true,
      academicLevel: true,
    }
  });

  const studentName = student?.name || (student?.email ? student.email.split('@')[0] : 'Student');
  const board = student?.board || 'WBCHSE';
  const academicLevel = student?.academicLevel || 'SEM-I';

  // Fetch all submitted test attempts with answers and questions
  const attempts = await prisma.testAttempt.findMany({
    where: {
      studentId,
      status: 'SUBMITTED'
    },
    include: {
      test: {
        select: {
          title: true,
          targetBoard: true,
          targetAcademicLevel: true
        }
      },
      answers: {
        include: {
          question: {
            select: {
              category: true,
              questionText: true,
              difficulty: true
            }
          }
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });

  // If no attempts found, return foundational onboarding profile
  if (attempts.length === 0) {
    const defaultTopics = [
      { name: "Atomic Structure", score: 50 },
      { name: "Periodic Table & Trends", score: 55 },
      { name: "Chemical Bonding", score: 50 },
      { name: "States of Matter & Gas Laws", score: 60 }
    ];

    const masteries: TopicMastery[] = defaultTopics.map(t => ({
      topic: t.name,
      chapter: t.name,
      subject: "Chemistry",
      masteryScore: t.score,
      confidence: "LOW",
      questionsAttempted: 0,
      correct: 0,
      incorrect: 0,
      accuracyPercentage: t.score,
      recommendedAction: `Begin foundational chapter practice for ${board} ${academicLevel}.`
    }));

    return {
      studentId,
      studentName,
      board,
      academicLevel,
      overallAccuracy: 50,
      totalQuestionsAttempted: 0,
      totalExamsCompleted: 0,
      topicMasteries: masteries,
      weakTopics: masteries.slice(0, 2),
      strongTopics: masteries.slice(2),
      todayRecommendation: {
        title: "Welcome to PIECHEM AI",
        description: `Take your first diagnostic practice quiz on Atomic Structure to calibrate your mastery profile.`,
        suggestedChapter: "Atomic Structure",
        estimatedMinutes: 20,
        actionType: "TAKE_QUIZ"
      }
    };
  }

  // Aggregate stats per topic/category
  const topicStats: Record<string, {
    attempted: number;
    correct: number;
    incorrect: number;
    difficulties: Record<string, number>;
  }> = {};

  let totalAttempted = 0;
  let totalCorrect = 0;

  for (const attempt of attempts) {
    for (const ans of attempt.answers) {
      if (!ans.question) continue;

      let category = ans.question.category?.trim();
      if (!category || category === 'Chemistry (Mixed)' || category === 'Chemistry' || category === 'Uncategorized') {
        // Infer from test title if question category is generic
        const title = attempt.test?.title?.toUpperCase() || '';
        if (title.includes('CAS') || title.includes('ATOMIC')) category = 'Atomic Structure';
        else if (title.includes('CPT') || title.includes('PERIODIC')) category = 'Periodic Table & Trends';
        else if (title.includes('CCB') || title.includes('BONDING')) category = 'Chemical Bonding';
        else if (title.includes('CSSC') || title.includes('SOLID')) category = 'Solid State Chemistry';
        else if (title.includes('THERMO')) category = 'Thermodynamics';
        else category = 'General Chemistry Principles';
      }

      if (!topicStats[category]) {
        topicStats[category] = { attempted: 0, correct: 0, incorrect: 0, difficulties: {} };
      }

      topicStats[category].attempted++;
      totalAttempted++;

      if (ans.isCorrect) {
        topicStats[category].correct++;
        totalCorrect++;
      } else {
        topicStats[category].incorrect++;
      }

      const diff = ans.question.difficulty || 'Moderate';
      topicStats[category].difficulties[diff] = (topicStats[category].difficulties[diff] || 0) + 1;
    }
  }

  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // Convert to TopicMastery list
  const topicMasteries: TopicMastery[] = Object.entries(topicStats).map(([topic, stats]) => {
    const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    
    // Deterministic mastery formula: 80% accuracy + 20% experience depth (capped at 100)
    const experienceBonus = Math.min(stats.attempted * 2, 20);
    const masteryScore = Math.min(Math.round((accuracy * 0.8) + experienceBonus), 100);

    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' = stats.attempted < 6
      ? 'LOW'
      : stats.attempted > 20 && accuracy >= 75
      ? 'HIGH'
      : 'MEDIUM';

    let recommendedAction = "Keep practicing to reinforce concepts.";
    if (accuracy < 50) {
      recommendedAction = `Urgent revision required. Review core notes and practice 10 easy-to-moderate questions.`;
    } else if (accuracy < 75) {
      recommendedAction = `Moderate accuracy (${accuracy}%). Focus on identifying distractor traps and edge cases.`;
    } else {
      recommendedAction = `Strong mastery (${accuracy}%). Maintain speed with timed advanced questions.`;
    }

    return {
      topic,
      chapter: topic,
      subject: "Chemistry",
      masteryScore,
      confidence,
      questionsAttempted: stats.attempted,
      correct: stats.correct,
      incorrect: stats.incorrect,
      accuracyPercentage: accuracy,
      recommendedAction
    };
  });

  // Sort ascending by accuracy for weak topics
  const sorted = [...topicMasteries].sort((a, b) => a.accuracyPercentage - b.accuracyPercentage);
  const weakTopics = sorted.filter(t => t.accuracyPercentage < 65);
  const strongTopics = sorted.filter(t => t.accuracyPercentage >= 65);

  const weakest = sorted[0] || { topic: "Atomic Structure", accuracyPercentage: 50 };

  const todayRecommendation = {
    title: `Priority Focus: ${weakest.topic}`,
    description: `Your current accuracy in ${weakest.topic} is ${weakest.accuracyPercentage}%. Spend 25 minutes reviewing notes and attempt 10 targeted practice questions.`,
    suggestedChapter: weakest.topic,
    estimatedMinutes: 25,
    actionType: ("PRACTICE" as const)
  };

  return {
    studentId,
    studentName,
    board,
    academicLevel,
    overallAccuracy,
    totalQuestionsAttempted: totalAttempted,
    totalExamsCompleted: attempts.length,
    topicMasteries,
    weakTopics: weakTopics.length > 0 ? weakTopics : sorted.slice(0, 2),
    strongTopics: strongTopics.length > 0 ? strongTopics : sorted.slice(-2),
    todayRecommendation
  };
}
