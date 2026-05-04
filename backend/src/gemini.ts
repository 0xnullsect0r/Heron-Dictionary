export interface GeminiWordInput {
  word: string;
  partOfSpeech: string;
  standardDefinitions: string[];
}

export interface GeminiWordResult {
  word: string;
  basic: { text: string; sentences: string[]; examples: string[] } | null;
  advanced: { text: string; sentences: string[]; examples: string[] } | null;
}

const DEFAULT_MODEL = 'gemini-3.1-flash-lite-preview';

export async function generateDefinitions(
  inputs: GeminiWordInput[],
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<GeminiWordResult[]> {
  const prompt = `You are a dictionary expert following the Study Technology methodology. For each word below, write definitions at two levels.

BASIC: Plain language for a beginner/child. Use only simple common words. 1-2 clear sentences. No jargon.
ADVANCED: Comprehensive for an expert. Include nuance, technical context, common confusions, etymology hints, edge cases.

Each level needs:
- "text": the definition itself
- "sentences": 2 natural example sentences showing the word in use
- "examples": 1-2 real-world usage contexts or collocations

IMPORTANT: The "standardDefinitions" provided are the source of truth. Base your basic/advanced on them.

Words:
${JSON.stringify(inputs, null, 2)}

Respond ONLY with a valid JSON array. No markdown, no explanation. Format:
[
  {
    "word": "example",
    "basic": {
      "text": "...",
      "sentences": ["...", "..."],
      "examples": ["..."]
    },
    "advanced": {
      "text": "...",
      "sentences": ["...", "..."],
      "examples": ["..."]
    }
  }
]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(60000),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json() as any;
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Failed to parse Gemini JSON response. Got: ${text.slice(0, 200)}`);

  try {
    return JSON.parse(jsonMatch[0]) as GeminiWordResult[];
  } catch {
    throw new Error(`Invalid JSON from Gemini: ${jsonMatch[0].slice(0, 200)}`);
  }
}
