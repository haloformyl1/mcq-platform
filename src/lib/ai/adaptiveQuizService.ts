/**
 * PIECHEM Adaptive Quiz Service
 * Dynamically serves practice questions prioritized by student's recorded weak topics.
 */

import { computeStudentLearningProfile } from "./weaknessDetector";
import { generateEducationalQuiz } from "./quizGenerator";
import { GeneratedQuestion, Language } from "./types";

export async function generateAdaptiveQuiz(params: {
  studentId: string;
  count?: number;
  language?: Language;
  userApiKey?: string;
}): Promise<{
  questions: GeneratedQuestion[];
  targetedWeakTopics: string[];
  adaptationReason: string;
}> {
  const { studentId, count = 5, language = "en", userApiKey } = params;

  // 1. Analyze student's learning profile & identify weak areas
  const profile = await computeStudentLearningProfile(studentId);
  const weakTopics = profile.weakTopics.map(t => t.topic);

  const targetTopic = weakTopics[0] || "Atomic Structure";
  const secondTopic = weakTopics[1] || "Chemical Bonding";

  const adaptationReason = language === 'bn'
    ? `আপনার পূর্ববর্তী পরীক্ষার পারফরম্যান্স অনুযায়ী ${targetTopic} এবং ${secondTopic} বিষয়ে দক্ষতা বাড়াতে এই কুইজটি সাজানো হয়েছে।`
    : `This adaptive drill is tailored to strengthen your mastery in ${targetTopic} (current accuracy: ${profile.weakTopics[0]?.accuracyPercentage || 50}%) and ${secondTopic}.`;

  // 2. Generate questions targeting the weakest topic first
  const questions = await generateEducationalQuiz({
    chapter: targetTopic,
    topic: targetTopic,
    count,
    difficulty: profile.overallAccuracy < 60 ? "Moderate" : "Difficult",
    language,
    userApiKey
  });

  return {
    questions,
    targetedWeakTopics: [targetTopic, secondTopic],
    adaptationReason
  };
}
