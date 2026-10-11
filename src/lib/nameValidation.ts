/**
 * Student Name Validator & Formatter
 * 
 * Rules:
 * 1. Only English alphabetic characters (A-Z, a-z) and single spaces between words.
 * 2. No numbers (0-9).
 * 3. No special characters (!@#$%^&*()_+-=[]{}|;':",.<>/?`~ etc.).
 * 4. No non-English alphabets/scripts (Bengali, Hindi/Devanagari, Arabic, etc.).
 * 5. First letter of each word automatically capitalized (Title Case).
 * 6. Multi-lingual offensive words detection (English, Hinglish, Banglish).
 */

// Normalized profanity patterns for English, Hinglish, and Banglish
const OFFENSIVE_TERMS: string[] = [
  // --- English Profanities & Slurs ---
  "fuck", "fucker", "fucking", "fck", "fuk",
  "shit", "bullshit", "ass", "asshole", "bitch",
  "bastard", "dick", "pussy", "cunt", "slut",
  "whore", "cock", "penis", "vagina", "boobs",
  "tits", "porn", "porno", "nude", "sex", "sexy",
  "nigger", "nigga", "retard", "faggot", "anal",

  // --- Hinglish Profanities & Slurs ---
  "gand", "gaand", "gandu", "gaandu", "gandoo",
  "chutiya", "chutiye", "choot", "chut", "chootiya",
  "bhosdi", "bhosdike", "bhosdika", "bhosdk", "bsdk",
  "madarchod", "madarchodh", "mc", "behenchod", "bhenchod",
  "bhenchodd", "bc", "bhadwe", "bhadwa", "bhadva",
  "lauda", "lawda", "laude", "loda", "lode", "lund",
  "harami", "kamina", "kamine", "kutta", "kutte",
  "randi", "r@ndi", "randwa", "chinal", "saala",
  "suar", "tatte", "jhant", "jhaant", "mutth",

  // --- Banglish Profanities & Slurs ---
  "bokachoda", "bokachuda", "bokachod", "boka choda",
  "choda", "chudi", "chuda", "chodna", "chodani",
  "khanki", "khankirpola", "khanki magi", "khankir pola",
  "magi", "magirchele", "magir pola", "magir chele",
  "baal", "baler", "balcher", "bara", "barar",
  "gud", "gude", "guder", "nang", "lyadh",
  "harampola", "haramir jhaad", "banchot", "banchod",
  "shala", "gandu pola", "podmarani", "pod", "chudmarani"
];

/**
 * Normalizes string for offensive words matching:
 * - lowercase
 * - remove duplicate consecutive letters (e.g. "chuuuutiya" -> "chutiya")
 * - convert common leetspeak substitutions
 */
function normalizeForProfanityCheck(text: string): string {
  let normalized = text.toLowerCase();
  
  // Leetspeak substitutions
  normalized = normalized
    .replace(/@/g, "a")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/7/g, "t");

  // Remove non-alphanumeric except space
  normalized = normalized.replace(/[^a-z0-9\s]/g, "");

  // Collapse consecutive repeated letters (e.g., "boooookaaachoooodaa" -> "bokachoda")
  normalized = normalized.replace(/(.)\1{2,}/g, "$1");

  return normalized;
}

/**
 * Checks if a string contains offensive terms in English, Hinglish, or Banglish
 */
export function containsOffensiveWords(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  const normalized = normalizeForProfanityCheck(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  const noSpace = normalized.replace(/\s+/g, "");

  for (const term of OFFENSIVE_TERMS) {
    const cleanTerm = term.replace(/\s+/g, "");

    // Check exact word match
    if (words.includes(term) || words.includes(cleanTerm)) {
      return true;
    }

    // Check if substring in combined name (e.g. "BokachodaRoy" or "GanduKumar")
    if (noSpace.includes(cleanTerm)) {
      return true;
    }

    // Check boundary regex in space-separated text
    const regex = new RegExp(`\\b${term.replace(/\s+/g, "\\s*")}\\b`, "i");
    if (regex.test(normalized)) {
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

  // Filter strictly to English alphabet letters and spaces
  const lettersOnly = rawName.replace(/[^a-zA-Z\s]/g, "");

  // Collapse multiple spaces into single space, but preserve a single trailing space if typing
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
 * Strictly validates a student name against all constraints.
 */
export function validateStudentName(rawName: string): NameValidationResult {
  if (!rawName || !rawName.trim()) {
    return {
      isValid: false,
      error: "Please enter your full student name."
    };
  }

  const trimmed = rawName.trim();

  // 1. Check for numbers
  if (/[0-9]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Numbers are not allowed in student names."
    };
  }

  // 2. Check for non-English letters (Bengali, Devanagari, emojis, unicode scripts)
  // English letters: a-z, A-Z and whitespace only
  if (/[^a-zA-Z\s]/.test(trimmed)) {
    // Check if contains non-ASCII (e.g. Bengali / Hindi / Emoji)
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

  // 4. Check for offensive / abusive / derogatory words
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
