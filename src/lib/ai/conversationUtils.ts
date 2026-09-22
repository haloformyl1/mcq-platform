/**
 * PIECHEM AI - Conversation Title & Date Grouping Utilities
 */

export interface ChatMessageTelemetry {
  keyConcepts?: string[];
  keyTakeaway?: string;
  relatedTopics?: string[];
  title?: string;
}

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  title?: string;
  keyConcepts?: string[];
  keyTakeaway?: string;
  relatedTopics?: string[];
  groundedInPiechem?: boolean;
  sourceCategory?: 'PIECHEM_MATERIAL' | 'STUDENT_DATA' | 'GENERAL_ACADEMIC' | 'WEB_RESEARCH' | 'PIECHEM_AND_WEB';
  timestamp: string;
  feedback?: 'like' | 'dislike' | null;
}

export interface AiConversationMeta {
  id: string;
  title: string;
  subject: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  messageCount?: number;
}

export type DateGroupKey = 'CONVERSATION HISTORY' | 'TODAY' | 'YESTERDAY' | 'PREVIOUS 7 DAYS' | 'PREVIOUS 30 DAYS' | 'OLDER';

/**
 * Generates a clean, academic 2-7 word title from the first user prompt.
 * Removes common filler prefixes and handles science formulas.
 */
export function generateConversationTitle(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') return 'STEM Inquiry';
  let cleaned = prompt.trim();

  // Common math/physics notation shortcuts
  cleaned = cleaned.replace(/∫\s*x\^?2\s*dx/i, 'Integration of x²');
  cleaned = cleaned.replace(/∫\s*([a-z0-9^+\-*/()]+)\s*dx/i, 'Integration of $1');

  // Handle comparison questions: "Difference between X and Y" -> "X vs Y"
  const diffMatch = cleaned.match(/(?:what is the |tell me the )?difference between\s+([^?.]+?)\s+and\s+([^?.]+)/i);
  if (diffMatch) {
    return formatTitleWords(diffMatch[1].trim() + ' vs ' + diffMatch[2].trim());
  }

  // Remove common conversational and polite intros
  const prefixes = [
    /^(?:can you\s+)?(?:please\s+)?explain(?:\s+the|\s+me|\s+to me)?\s+/i,
    /^(?:can you\s+)?(?:please\s+)?derive(?:\s+the)?\s+/i,
    /^(?:how do (?:you|i)\s+)?(?:please\s+)?solve(?:\s+the)?\s+/i,
    /^(?:what is|what are|what's)\s+(?:the\s+)?/i,
    /^(?:how does|how do|why is|why does)\s+(?:the\s+)?/i,
    /^(?:tell me about|help me (?:with|understand))\s+(?:the\s+)?/i,
    /^(?:show me|give me(?:\s+an?)?)\s+/i,
    /^(?:could you|would you)\s+/i,
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '');
  }

  // Remove trailing "step by step", "in detail", punctuation
  cleaned = cleaned.replace(/\s+(?:step by step|in detail|with derivation|simply|clearly)\b/gi, '');
  cleaned = cleaned.replace(/[?.!;,:]+$/, '').trim();

  // Limit to 2–7 words (max ~45 chars)
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 6) {
    cleaned = words.slice(0, 6).join(' ');
  }

  return formatTitleWords(cleaned || 'STEM Inquiry');
}

function formatTitleWords(str: string): string {
  if (!str) return 'STEM Inquiry';
  const minorWords = new Set(['and', 'or', 'of', 'in', 'the', 'a', 'an', 'to', 'for', 'vs', 'with', 'by', 'on', 'at']);
  
  const words = str.split(' ').map((w, index) => {
    const lower = w.toLowerCase();
    // Keep scientific terms or acronyms uppercase (DNA, RNA, SN1, SN2, ATP, pH)
    if (/^(dna|rna|sn1|sn2|atp|adp|ph|em|si|nmr|ir|uv|ke|pe|emf)$/i.test(w)) {
      return w.toUpperCase();
    }
    if (index > 0 && minorWords.has(lower)) {
      return lower;
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  const result = words.join(' ').trim();
  return result.length > 50 ? result.slice(0, 48) + '…' : result;
}

/**
 * Dynamically groups conversations into TODAY, YESTERDAY, PREVIOUS 7 DAYS, etc.
 * Based on current local date and conversation updatedAt.
 */
export function groupConversationsByDate(conversations: AiConversationMeta[]): { group: DateGroupKey; items: AiConversationMeta[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOf7Days = startOfToday - 7 * oneDayMs;
  const startOf30Days = startOfToday - 30 * oneDayMs;

  const groups: Record<DateGroupKey, AiConversationMeta[]> = {
    'CONVERSATION HISTORY': [],
    'TODAY': [],
    'YESTERDAY': [],
    'PREVIOUS 7 DAYS': [],
    'PREVIOUS 30 DAYS': [],
    'OLDER': []
  };

  conversations.forEach(conv => {
    const time = new Date(conv.updatedAt).getTime();
    if (isNaN(time)) {
      groups['CONVERSATION HISTORY'].push(conv);
      return;
    }

    if (time >= startOfToday) {
      groups['CONVERSATION HISTORY'].push(conv);
    } else if (time >= startOfYesterday) {
      groups['YESTERDAY'].push(conv);
    } else if (time >= startOf7Days) {
      groups['PREVIOUS 7 DAYS'].push(conv);
    } else if (time >= startOf30Days) {
      groups['PREVIOUS 30 DAYS'].push(conv);
    } else {
      groups['OLDER'].push(conv);
    }
  });

  const orderedKeys: DateGroupKey[] = ['CONVERSATION HISTORY', 'YESTERDAY', 'PREVIOUS 7 DAYS', 'PREVIOUS 30 DAYS', 'OLDER'];

  // Return groups that have items, but if completely empty, return TODAY with empty array
  const activeGroups = orderedKeys
    .filter(key => groups[key].length > 0)
    .map(key => ({
      group: key,
      items: groups[key]
    }));

  if (activeGroups.length === 0) {
    return [{ group: 'CONVERSATION HISTORY', items: [] }];
  }

  return activeGroups;
}
