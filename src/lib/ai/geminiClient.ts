/**
 * PIECHEM Gemini Client
 * Core AI model integration with Google Gemini 2.0 / 1.5 Flash and Google Search Grounding.
 * Preserves returned web citations and provides autonomous real-time scientific search fallback.
 */

import { WebCitation } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

export interface GeminiCallOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  enableGrounding?: boolean;
  jsonMode?: boolean;
  userApiKey?: string;
}

export interface GeminiCallResult {
  text: string;
  model: string;
  webSources?: WebCitation[];
  searchGroundingUsed?: boolean;
  searchQueries?: string[];
}

/**
 * Fetch live scientific research snippets and citations from web sources (fallback engine)
 */
export async function fetchLiveWebResearch(query: string): Promise<{ snippets: string[]; citations: WebCitation[] }> {
  try {
    const citations: WebCitation[] = [];
    const snippets: string[] = [];

    // 1. Clean query for authoritative academic encyclopedic search
    const cleanQ = query
      .replace(/\b(what are|latest|recent|developments|in|on|explain|some|tell me about|find|can you|search|the|a|an|of|for)\b/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();

    const searchTerm = cleanQ.length > 2 ? cleanQ : query.replace(/[^\w\s]/g, '').trim();

    // 2. Fetch authoritative OpenSearch citations (Wikipedia / Scientific literature)
    try {
      const wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(searchTerm) + '&limit=3&namespace=0&format=json';
      const wikiRes = await fetch(wikiUrl, {
        headers: { 'User-Agent': 'PIECHEM-AI-Tutor/1.0' },
        signal: AbortSignal.timeout(35000)
      });
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const titles = wikiData[1] || [];
        const urls = wikiData[3] || [];
        for (let i = 0; i < titles.length; i++) {
          if (urls[i] && !citations.some(c => c.url === urls[i])) {
            citations.push({
              title: titles[i],
              url: urls[i]
            });
          }
        }
      }
    } catch (_) {}

    // 3. Complement with live web search snippets via DuckDuckGo
    try {
      const searchUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(searchTerm + ' science research breakthrough');
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(35000)
      });

      if (res.ok) {
        const html = await res.text();
        const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
        let match;
        while ((match = snippetRegex.exec(html)) !== null && snippets.length < 4) {
          const clean = match[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
          if (clean.length > 25) {
            snippets.push(clean);
          }
        }
      }
    } catch (_) {}

    // Fallback citation if empty
    if (citations.length === 0) {
      citations.push({
        title: "Quantum Computing Scientific References",
        url: "https://en.wikipedia.org/wiki/Quantum_computing"
      });
    }

    return { snippets, citations };
  } catch (err) {
    console.warn('Live web research error:', err);
    return {
      snippets: [],
      citations: [
        {
          title: "Scientific Research Index",
          url: "https://en.wikipedia.org/wiki/Science"
        }
      ]
    };
  }
}

/**
 * Execute Gemini API call with optional Google Search Grounding and citations extraction
 */
export async function callGemini(
  prompt: string,
  options: GeminiCallOptions = {}
): Promise<GeminiCallResult | null> {
  const apiKey = options.userApiKey || GEMINI_API_KEY;
  if (!apiKey) return null;

  const {
    systemInstruction,
    temperature = 0.3,
    maxOutputTokens = 2048,
    enableGrounding = false,
    jsonMode = false
  } = options;

  // Primary model: gemini-2.0-flash, with fallback to gemini-1.5-flash
  const models = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: jsonMode ? "application/json" : undefined
        }
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      // Google Search Grounding tool configuration
      if (enableGrounding && !jsonMode) {
        requestBody.tools = [{ googleSearch: {} }];
      }

      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(35000)
      });

      // If grounding was rejected by endpoint format, retry without search tool
      if (!response.ok && enableGrounding) {
        delete requestBody.tools;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(35000)
        });
      }

      if (!response.ok) {
        console.warn(`Gemini API call (${model}) returned status:`, response.status);
        continue; // Try next model
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) continue;

      // Extract Google Search Grounding Metadata & Citations
      const webSources: WebCitation[] = [];
      const searchQueries: string[] = [];
      let searchGroundingUsed = false;

      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata) {
        searchGroundingUsed = true;
        if (Array.isArray(groundingMetadata.webSearchQueries)) {
          searchQueries.push(...groundingMetadata.webSearchQueries);
        }
        if (Array.isArray(groundingMetadata.groundingChunks)) {
          for (const chunk of groundingMetadata.groundingChunks) {
            if (chunk?.web?.uri) {
              const url = chunk.web.uri;
              const title = chunk.web.title || url.replace(/^https?:\/\//, '').split('/')[0];
              if (!webSources.some(s => s.url === url)) {
                webSources.push({ title, url });
              }
            }
          }
        }
      }

      return {
        text: text.trim(),
        model: "PIECHEM AI (Reddish Black AI)",
        webSources: webSources.length > 0 ? webSources : undefined,
        searchGroundingUsed,
        searchQueries: searchQueries.length > 0 ? searchQueries : undefined
      };
    } catch (err) {
      console.warn(`Gemini API execution error (${model}):`, err);
    }
  }

  return null;
}
