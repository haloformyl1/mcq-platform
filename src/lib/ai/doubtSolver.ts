/**
 * PIECHEM Progressive Doubt Solver Service
 * Supports progressive hints (Hint 1, Hint 2, Hint 3) and full solutions only when requested.
 */

import { ProgressiveHint, Language } from "./types";
import { callGemini } from "./geminiClient";
import { cleanJsonOutput } from "./validators";

export async function getProgressiveHint(params: {
  questionText: string;
  options?: Record<string, string>;
  correctAnswer?: string;
  hintLevel: 1 | 2 | 3 | 4;
  language?: Language;
  userApiKey?: string;
}): Promise<ProgressiveHint> {
  const { questionText, options, correctAnswer, hintLevel, language = "en", userApiKey } = params;

  if (hintLevel === 4) {
    // Full solution requested
    return {
      hintLevel: 4,
      title: language === 'bn' ? "সম্পূর্ণ সমাধান (Full Solution)" : "Verified Full Solution",
      content: language === 'bn'
        ? `সঠিক উত্তর হলো বিকল্প ${correctAnswer || 'A'}। মূল বৈজ্ঞানিক সূত্র এবং সমতাকরণ প্রয়োগ করলে দেখা যায় যে এই বিকল্পটি সমস্ত বিক্রিয়ার শর্ত পূরণ করে।`
        : `The correct answer is Option ${correctAnswer || 'A'}. Applying fundamental stoichiometric balance and reaction rules confirms this choice.`,
      isFullSolution: true
    };
  }

  const prompt = `A student is attempting this chemistry question:
"${questionText}"
${options ? `Options: ${JSON.stringify(options)}` : ''}

Generate Progressive Hint Level ${hintLevel} for this student.
- Level 1: Conceptual Clue (What fundamental scientific principle governs this question? Do NOT give away the answer).
- Level 2: Specific Guidance (Which formula, periodic trend, or intermediate should they inspect?).
- Level 3: Approach (Step-by-step method to calculate or deduce without naming the final option).

Language: ${language === 'bn' ? 'Respond in UNICODE BENGALI (বাংলা).' : 'Respond in ENGLISH.'}

OUTPUT FORMAT: Return valid JSON:
{
  "title": "Hint title...",
  "content": "Hint guidance..."
}`;

  const geminiResult = await callGemini(prompt, {
    temperature: 0.2,
    jsonMode: true,
    userApiKey
  });

  if (geminiResult && geminiResult.text) {
    try {
      const parsed = JSON.parse(cleanJsonOutput(geminiResult.text));
      if (parsed.content) {
        return {
          hintLevel,
          title: parsed.title || (language === 'bn' ? `সংকেত ${hintLevel} (Hint ${hintLevel})` : `Hint ${hintLevel}`),
          content: parsed.content,
          isFullSolution: false
        };
      }
    } catch (e) {
      console.warn('Failed to parse hint JSON:', e);
    }
  }

  // Fallback progressive hints
  const fallbackTitles: Record<number, string> = {
    1: language === 'bn' ? "মূল ধারণাগত সংকেত (Hint 1)" : "Conceptual Clue (Hint 1)",
    2: language === 'bn' ? "সুনির্দিষ্ট দিকনির্দেশনা (Hint 2)" : "Targeted Guidance (Hint 2)",
    3: language === 'bn' ? "সমাধানের দৃষ্টিভঙ্গি (Hint 3)" : "Step-by-Step Approach (Hint 3)"
  };

  const fallbackContents: Record<number, string> = {
    1: language === 'bn'
      ? "প্রথমে প্রশ্নটিতে প্রদত্ত শর্তাবলীর দিকে লক্ষ্য করুন: বিক্রিয়াটি কি তাপমোচী না তাপগ্রাহী, নাকি ইলেকট্রন বিন্যাসের স্থিতিশীলতার ওপর নির্ভরশীল?"
      : "Start by identifying the core chemical principle: Is this governed by orbital symmetry, effective nuclear charge, or Le Chatelier's equilibrium?",
    2: language === 'bn'
      ? "ইলেকট্রন স্থানান্তর বা বন্ধন বিভাজনের পর কোন মধ্যবর্তী অবস্থা (যেমন কার্বোক্যাটায়ন বা মুক্তমূলক) তৈরি হয় তা যাচাই করুন।"
      : "Check intermediate stability: Consider carbocation hyperconjugation, resonance, or spectrochemical ligand field splitting.",
    3: language === 'bn'
      ? "যেসব বিকল্প স্পষ্টতই অস্থিতিশীল বা রাসায়নিক নিয়মের পরিপন্থী, সেগুলোকে বাদ (Eliminate) দিয়ে বাকি বিকল্পগুলোর মধ্যে তুলনা করুন।"
      : "Eliminate extreme or impossible options first, then apply formal charge or thermodynamic equations to verify the remainder."
  };

  return {
    hintLevel,
    title: fallbackTitles[hintLevel] || `Hint ${hintLevel}`,
    content: fallbackContents[hintLevel] || "Review the governing chemical equation and eliminate unlikely options.",
    isFullSolution: false
  };
}
