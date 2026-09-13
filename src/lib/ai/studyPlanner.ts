/**
 * PIECHEM Personalized AI Study Plan Generator
 * Constructs daily structured preparation schedules tailored to student mastery and linked to PIECHEM materials.
 */

import { StudyPlan, Language, AcademicLevel } from "./types";
import { computeStudentLearningProfile } from "./weaknessDetector";
import { retrieveRelevantPiechemMaterials } from "./materialRetriever";
import { callGemini } from "./geminiClient";
import { cleanJsonOutput } from "./validators";

export async function generatePersonalizedStudyPlan(params: {
  studentId: string;
  durationDays?: number;
  targetGoal?: string;
  language?: Language;
  level?: AcademicLevel;
  userApiKey?: string;
}): Promise<StudyPlan> {
  const {
    studentId,
    durationDays = 7,
    targetGoal = "NEET / Board Examination",
    language = "en",
    level = "INTERMEDIATE",
    userApiKey
  } = params;

  const profile = await computeStudentLearningProfile(studentId);
  const materials = await retrieveRelevantPiechemMaterials(targetGoal);

  const weakTopicNames = profile.weakTopics.map(t => t.topic);
  const safeDays = Math.min(Math.max(durationDays, 3), 14);

  // Attempt LLM structured generation
  const prompt = `Create a rigorous, highly structured ${safeDays}-Day Chemistry preparation study plan for student targeting "${targetGoal}".
Student Level: ${level}.
Weak Areas requiring priority: ${weakTopicNames.join(', ') || 'Atomic Structure, Periodic Table, Chemical Bonding'}.
Available PIECHEM Platform Materials:
${materials.map(m => `- ${m.title} (${m.url})`).join('\n')}

Language requirement: ${language === 'bn' ? 'Respond in UNICODE BENGALI (বাংলা).' : 'Respond in clear ENGLISH.'}

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "title": "Plan title...",
  "durationDays": ${safeDays},
  "targetExamOrGoal": "${targetGoal}",
  "days": [
    {
      "dayNumber": 1,
      "focusChapter": "Chapter Name",
      "topics": ["Topic 1", "Topic 2"],
      "tasks": [
        {
          "type": "READ_MATERIAL",
          "description": "Read notes and formulas...",
          "estimatedMinutes": 30,
          "piechemMaterialTitle": "Title if applicable",
          "piechemMaterialUrl": "URL if applicable"
        },
        {
          "type": "SOLVE_MCQS",
          "description": "Solve 15 moderate MCQs...",
          "estimatedMinutes": 30
        }
      ]
    }
  ],
  "proTips": [
    "Tip 1...",
    "Tip 2..."
  ]
}`;

  const geminiResult = await callGemini(prompt, {
    temperature: 0.3,
    jsonMode: true,
    userApiKey
  });

  if (geminiResult && geminiResult.text) {
    try {
      const parsed = JSON.parse(cleanJsonOutput(geminiResult.text));
      if (parsed.days && Array.isArray(parsed.days)) {
        return {
          title: parsed.title || `${safeDays}-Day Personalized Study Plan`,
          durationDays: safeDays,
          targetExamOrGoal: targetGoal,
          studentLevel: level,
          days: parsed.days,
          proTips: parsed.proTips || [
            "Maintain an error notebook for repeated MCQ traps.",
            "Always revise formula sheets 15 minutes before practice tests."
          ],
          language
        };
      }
    } catch (e) {
      console.warn('Failed to parse Gemini study plan JSON:', e);
    }
  }

  // Fallback synthetic structured plan
  const chaptersList = weakTopicNames.length >= 3
    ? weakTopicNames
    : ["Atomic Structure & Quantum Numbers", "Chemical Bonding & Molecular Structure", "Periodic Table & Periodic Properties", "Solid State Chemistry", "States of Matter & Gas Laws"];

  const days = [];
  for (let d = 1; d <= safeDays; d++) {
    const chapter = chaptersList[(d - 1) % chaptersList.length];
    const isMockDay = d === safeDays;
    const isRevisionDay = d === safeDays - 1;

    days.push({
      dayNumber: d,
      focusChapter: isMockDay ? "Full Syllabus Practice" : isRevisionDay ? "Mistake Review & Weak Areas" : chapter,
      topics: isMockDay ? ["Comprehensive Revision", "Speed Drill"] : [chapter, "Formula Derivations"],
      tasks: [
        {
          type: ("READ_MATERIAL" as const),
          description: language === 'bn'
            ? `${chapter}-এর মূল নোটস এবং সংজ্ঞাসমূহ রিভিশন করুন।`
            : `Review core conceptual notes and governing rules for ${chapter}.`,
          estimatedMinutes: 25,
          piechemMaterialTitle: materials[0]?.title,
          piechemMaterialUrl: materials[0]?.url
        },
        {
          type: ("SOLVE_MCQS" as const),
          description: language === 'bn'
            ? `১৫টি নির্বাচিত বহুনির্বাচনী প্রশ্ন (MCQ) সমাধান করুন।`
            : `Attempt 15 topic-focused MCQs under timed conditions.`,
          estimatedMinutes: 30
        },
        {
          type: ("REVISE_MISTAKES" as const),
          description: language === 'bn'
            ? "ভুল উত্তরগুলোর কারণ চিহ্নিত করুন এবং নোট খাতায় লিখুন।"
            : "Analyze incorrect picks and document the distractor traps.",
          estimatedMinutes: 15
        }
      ]
    });
  }

  return {
    title: language === 'bn'
      ? `${safeDays}-দিনের ব্যক্তিগত প্রস্তুতি পরিকল্পনা (${targetGoal})`
      : `${safeDays}-Day Personalized Revision Plan for ${targetGoal}`,
    durationDays: safeDays,
    targetExamOrGoal: targetGoal,
    studentLevel: level,
    days,
    proTips: language === 'bn'
      ? [
          "পরীক্ষার আগে প্রতিদিন অন্তত ২০ মিনিট ভুল হওয়া প্রশ্নের কারণ পর্যালোচনা করুন।",
          "রাসায়নিক সমীকরণ এবং গাণিতিক সূত্রের একটি নিজস্ব তালিকা তৈরি করুন।"
        ]
      : [
          "Dedicate 20 minutes daily to analyzing why you chose specific distractors.",
          "Keep a personal formula sheet for electrochemistry and chemical kinetics."
        ],
    language
  };
}
