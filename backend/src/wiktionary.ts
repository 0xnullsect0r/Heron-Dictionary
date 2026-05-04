interface WiktionaryDefinition {
  definition: string;
  examples?: string[];
}

interface WiktionaryEntry {
  partOfSpeech: string;
  definitions: WiktionaryDefinition[];
}

interface WiktionaryResponse {
  [lang: string]: WiktionaryEntry[];
}

export interface WiktionaryDraft {
  word: string;
  part_of_speech: string;
  etymology: string;
  synonyms: string[];
  related_words: string[];
  idioms: { phrase: string; meaning: string }[];
  usage_notes: string;
  definitions: {
    level: 'basic' | 'standard' | 'advanced';
    text: string;
    sentences: string[];
    examples: string[];
    sort_order: number;
  }[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '').trim();
}

export async function fetchWiktionaryWord(word: string): Promise<WiktionaryDraft | null> {
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Heron-Dictionary/1.0' } });
  if (!res.ok) return null;

  const data = await res.json() as WiktionaryResponse;
  const english = data['en'];
  if (!english || english.length === 0) return null;

  const entry = english[0];
  const pos = entry.partOfSpeech || '';
  const rawDefs = entry.definitions || [];

  const cleanDefs = rawDefs
    .filter(d => d.definition)
    .map(d => ({
      text: stripHtml(d.definition),
      examples: (d.examples || []).map(stripHtml).filter(Boolean),
    }));

  if (cleanDefs.length === 0) return null;

  // Use the first definition as the "standard" level draft
  const standardDef = cleanDefs[0];
  const allExamples = cleanDefs.flatMap(d => d.examples).slice(0, 5);

  return {
    word: word.toLowerCase(),
    part_of_speech: pos,
    etymology: '',
    synonyms: [],
    related_words: [],
    idioms: [],
    usage_notes: cleanDefs.length > 1 ? cleanDefs.slice(1).map((d, i) => `${i + 2}. ${d.text}`).join('\n') : '',
    definitions: [
      {
        level: 'basic',
        text: '',
        sentences: [],
        examples: [],
        sort_order: 0,
      },
      {
        level: 'standard',
        text: standardDef.text,
        sentences: [],
        examples: allExamples,
        sort_order: 0,
      },
      {
        level: 'advanced',
        text: '',
        sentences: [],
        examples: [],
        sort_order: 0,
      },
    ],
  };
}
