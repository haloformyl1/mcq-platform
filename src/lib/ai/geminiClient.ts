/**
 * PIECHEM Gemini Client
 * Server-side wrapper for Google Gemini 1.5 / 2.0 Flash with Google Search Grounding and structured output.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

export interface GeminiCallOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  enableGrounding?: boolean;
  jsonMode?: boolean;
  userApiKey?: string;
}

export async function callGemini(
  prompt: string,
  options: GeminiCallOptions = {}
): Promise<{ text: string; model: string } | null> {
  const apiKey = options.userApiKey || GEMINI_API_KEY;
  if (!apiKey) return null;

  const {
    systemInstruction,
    temperature = 0.3,
    maxOutputTokens = 2048,
    enableGrounding = false,
    jsonMode = false
  } = options;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

    if (enableGrounding && !jsonMode) {
      requestBody.tools = [{ googleSearch: {} }];
    }

    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(12000)
    });

    // If search grounding was rejected by endpoint format, retry without tool
    if (!response.ok && enableGrounding) {
      delete requestBody.tools;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(12000)
      });
    }

    if (!response.ok) {
      console.warn('Gemini API call returned status:', response.status);
      return null;
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) return null;

    return {
      text: text.trim(),
      model: 'Google Gemini 1.5/2.0 Flash'
    };
  } catch (err) {
    console.warn('Gemini API execution error:', err);
    return null;
  }
}
