/**
 * Student Name Validator & Multi-Lingual Profanity Defense Engine
 * 
 * Rules:
 * 1. Only English alphabetic characters (A-Z, a-z) and single spaces between words.
 * 2. No numbers (0-9).
 * 3. No special characters (!@#$%^&*()_+-=[]{}|;':",.<>/?`~ etc.).
 * 4. No non-English alphabets/scripts (Bengali, Hindi/Devanagari, Arabic, etc.).
 * 5. First letter of each word automatically capitalized (Title Case).
 * 6. High-coverage root-stemming & phonetic detection for English, Hinglish, Banglish profanities.
 * 7. Server-side AI safety guardrail via Gemini fallback.
 */

// Root phonetic patterns designed to catch millions of word variations/abbreviations/slangs
export const OFFENSIVE_ROOT_PATTERNS: RegExp[] = [
  // --- BC / MC / Bhenchod / Bancho / Pencho Family ---
  // Catches: bancho, bhencho, pencho, banchod, bhenchod, bhnchod, benchod, bhenchodo, banchot, etc.
  /\b[bpv]+h?[aeiou]*n+ch+[oauie0]+[dt]?\b/i,
  /\b[bpv]+h?[aeiou]*n+ch+[oauie0]+[dt]?[a-z]*\b/i,
  // Catches: madarchod, madarcho, mdrchod, etc.
  /\bm+h?[aeiou]*d+[aeiou]*r+ch+[oauie0]+[dt]?[a-z]*\b/i,
  // Catches: bhen k lode, etc.
  /\b(bc|mc|bsdk|bhosdk|mkc|bkc)\b/i,

  // --- Chutiya / Choot Family ---
  // Catches: chutiya, chootya, chutia, chootiya, chut, choot, chutiye, etc.
  /\bch+[uoi0]+t+[a-z]*\b/i,

  // --- Gandu / Gaand Family ---
  // Catches: gandu, gaandu, gandoo, gandwa, gaand, gand, etc.
  /\bg+[aou0]*[an]*n*d+[uoi0a-z]*\b/i,

  // --- Bhosdike / Bhosdi Family ---
  // Catches: bhosdike, bhosdika, bhosdi, bhosda, bhosad, etc.
  /\bb+h?[oau0]+s+[a-z]*d+[a-z]*\b/i,

  // --- Bokachoda / Bokacho Family (Banglish) ---
  // Catches: bokachoda, bokachuda, bokachod, bokacho, bukachoda, etc.
  /\bb+[oau0]+k+[aou0]*\s*ch+[oauie0]+[dt]?[a-z]*\b/i,

  // --- Khanki / Magi Family (Banglish) ---
  // Catches: khanki, khankirpola, khankirchele, magirchele, magirpola, magi, etc.
  /\bkh+a+n+k+[a-z]*\b/i,
  /\bm+a+g+[iie]+r?\s*[a-z]*\b/i,

  // --- Baal / Bara Family (Banglish) ---
  // Catches: baal, baler, balcher, barar, bara, etc.
  /\bb+a+a*l+(?:er|cher|choda)?\b/i,
  /\bb+a+r+a+(?:r|choda)?\b/i,

  // --- Chodna / Choda Family ---
  // Catches: chodna, chodani, chudmarani, chudai, chuda, chodi, etc.
  /\bch+[oau0]+d+[a-z]*\b/i,

  // --- Lund / Lauda / Loda Family ---
  // Catches: lauda, lawda, loda, lode, lund, lundur, lodha, etc.
  /\bl+[aou0]+[uw]*d+[a-z]*\b/i,
  /\bl+u+n+d+[a-z]*\b/i,

  // --- Harami / Kamina / Kutta / Randi Family ---
  /\br+a*n+d+[iiea-z]*\b/i,
  /\bh+a+r+a+m+[a-z]*\b/i,
  /\bk+a+m+i+n+[a-z]*\b/i,
  /\bk+u+t+t+[a-z]*\b/i,
  /\bb+h+a+d+[wv]+[a-z]*\b/i,
  /\bs+a+a*l+[a-z]*\b/i,

  // --- English Slurs & Vulgarities ---
  /\bf+[u*@0]+c*k+[a-z]*\b/i,
  /\bb+i+t+c+h+[a-z]*\b/i,
  /\ba+s+s+h+o+l+e*[a-z]*\b/i,
  /\bb+a+s+t+a+r+d+[a-z]*\b/i,
  /\bd+i+c+k+[a-z]*\b/i,
  /\bp+u+s+s+y+[a-z]*\b/i,
  /\bc+u+n+t+[a-z]*\b/i,
  /\bs+l+u+t+[a-z]*\b/i,
  /\bw+h+o+r+e+[a-z]*\b/i,
  /\bp+e+n+i+s+[a-z]*\b/i,
  /\bv+a+g+i+n+a+[a-z]*\b/i,
  /\bp+o+r+n+[a-z]*\b/i,
  /\bn+i+g+g+[a-z]*\b/i
];

// Explicit keywords list for direct lookup & sub-string matches
const OFFENSIVE_KEYWORDS: string[] = [
  "bancho", "bhencho", "pencho", "bhncho", "benchod", "banchod", "bhenchod", "banchot",
  "madarchod", "madarcho", "chutiya", "chutya", "chootiya", "choot", "chut", "chutiye",
  "gandu", "gandoo", "gaand", "gand", "gando", "bhosdike", "bhosdi", "bhosdika", "bhosdk", "bsdk",
  "bokachoda", "bokachod", "bokacho", "bokachuda", "khanki", "khankirpola", "magi", "magirchele",
  "baal", "baler", "bara", "barar", "chodna", "chodani", "chuda", "choda", "chudi", "chudmarani",
  "lauda", "lawda", "loda", "lode", "lund", "randi", "harami", "kamina", "kutta", "saala",
  "fuck", "fucker", "fucking", "fck", "shit", "bitch", "asshole", "dick", "pussy", "cunt", "slut", "whore", "nigger"
];

/**
 * Normalizes string for offensive words matching:
 * - lowercase
 * - converts leetspeak (0->o, @->a, 1->i, etc.)
 * - collapses consecutive repeated letters (e.g., "baaaannnchoooo" -> "bancho")
 */
export function normalizeForProfanityCheck(text: string): string {
  let normalized = text.toLowerCase();
  
  normalized = normalized
    .replace(/@/g, "a")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/7/g, "t");

  // Keep letters and whitespace
  normalized = normalized.replace(/[^a-z\s]/g, "");

  // Collapse consecutive repeated letters (3 or more down to 1)
  normalized = normalized.replace(/(.)\1{1,}/g, "$1");

  return normalized;
}

/**
 * Fast synchronous check using Regex Root Stemming and Phonetic Normalization.
 * Operates on client and server.
 */
export function containsOffensiveWords(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  const rawLower = text.toLowerCase().trim();
  const normalized = normalizeForProfanityCheck(text);
  const words = rawLower.split(/\s+/).filter(Boolean);
  const normWords = normalized.split(/\s+/).filter(Boolean);
  const noSpaceRaw = rawLower.replace(/\s+/g, "");
  const noSpaceNorm = normalized.replace(/\s+/g, "");

  // 1. Direct Keyword / Substring match
  for (const kw of OFFENSIVE_KEYWORDS) {
    if (words.includes(kw) || normWords.includes(kw)) return true;
    if (noSpaceRaw.includes(kw) || noSpaceNorm.includes(kw)) return true;
  }

  // 2. Comprehensive Root Regex Stemming
  for (const regex of OFFENSIVE_ROOT_PATTERNS) {
    if (regex.test(rawLower) || regex.test(normalized)) {
      return true;
    }
    // Also test without spaces (e.g. "BanchoRoy" -> "banchoroy")
    if (regex.test(noSpaceRaw) || regex.test(noSpaceNorm)) {
      return true;
    }
  }

  return false;
}

/**
 * Automatically capitalizes the first letter of each word (Title Case)
 * and cleans up irregular spacing.
 * e.g., "arghyadeep roy" -> "Arghyadeep Roy"
 */
export function formatStudentName(rawName: string): string {
  if (!rawName) return "";

  const lettersOnly = rawName.replace(/[^a-zA-Z\s]/g, "");
  const hasTrailingSpace = lettersOnly.endsWith(" ");
  const trimmed = lettersOnly.trim();

  if (!trimmed) {
    return hasTrailingSpace ? " " : "";
  }

  const capitalized = trimmed
    .split(/\s+/)
    .map(word => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return hasTrailingSpace ? `${capitalized} ` : capitalized;
}

export interface NameValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
}

/**
 * Validates a student name against character and offensive-word rules.
 */
export function validateStudentName(rawName: string): NameValidationResult {
  if (!rawName || !rawName.trim()) {
    return {
      isValid: false,
      error: "Please enter your full student name."
    };
  }

  const trimmed = rawName.trim();

  // 1. Numbers check
  if (/[0-9]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Numbers are not allowed in student names."
    };
  }

  // 2. Character & Language check (Strictly English alphabets and space)
  if (/[^a-zA-Z\s]/.test(trimmed)) {
    if (/[^\x00-\x7F]/.test(trimmed)) {
      return {
        isValid: false,
        error: "Names must be entered in English alphabets only."
      };
    }
    return {
      isValid: false,
      error: "Special characters or symbols are not allowed in student names."
    };
  }

  // 3. Minimum length check
  const cleanName = formatStudentName(trimmed);
  if (cleanName.length < 2) {
    return {
      isValid: false,
      error: "Name must be at least 2 letters long."
    };
  }

  // 4. Rule-based offensive / slang check
  if (containsOffensiveWords(trimmed) || containsOffensiveWords(cleanName)) {
    return {
      isValid: false,
      error: "Inappropriate or offensive names are strictly prohibited. Please enter your genuine student name."
    };
  }

  return {
    isValid: true,
    sanitizedName: cleanName
  };
}

/**
 * Server-Side AI Guardrail using Google Gemini.
 * Evaluates subtle multilingual nuances (English, Hinglish, Banglish).
 */
export async function verifyNameWithAI(name: string): Promise<{ isValid: boolean; reason?: string }> {
  // First run the deterministic local checks
  const localCheck = validateStudentName(name);
  if (!localCheck.isValid) {
    return { isValid: false, reason: localCheck.error };
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    // If no AI key configured, deterministic check passed
    return { isValid: true };
  }

  try {
    const prompt = `You are a strict safety validator for student registrations on an Indian examination platform.
Evaluate if the following candidate student name is a genuine human name OR contains inappropriate, offensive, vulgar, or abusive words/slang in English, Hinglish (Hindi written in English), or Banglish (Bengali written in English).

Candidate Name: "${name}"

Examples of INAPPROPRIATE words/slang:
- Hinglish: bancho, bhenchod, gandu, chutiya, lauda, loda, bhosdike, harami, kutta, kamina, saala, etc.
- Banglish: bokachoda, bokacho, khanki, baal, chodna, magi, bara, etc.
- English: fuck, bitch, asshole, dick, porn, etc.

Respond ONLY with valid JSON in this exact structure:
{"isAppropriate": true} OR {"isAppropriate": false, "reason": "offensive word detected"}
`;

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.0,
              maxOutputTokens: 100,
              responseMimeType: "application/json"
            }
          }),
          signal: AbortSignal.timeout(3500) // Fast 3.5s timeout
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.isAppropriate === false) {
              return {
                isValid: false,
                reason: "Inappropriate or offensive names are strictly prohibited. Please enter your genuine student name."
              };
            }
            return { isValid: true };
          }
        }
      } catch (e) {
        // Continue to fallback model or fallback to regex
      }
    }
  } catch (err) {
    console.warn("AI Name Verification Notice:", err);
  }

  // Default to local verification result if AI times out or is unreachable
  return { isValid: true };
}
