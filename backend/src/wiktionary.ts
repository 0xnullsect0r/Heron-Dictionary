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
  hasBasicFromSimple: boolean;
  definitions: {
    level: 'basic' | 'standard' | 'advanced';
    text: string;
    sentences: string[];
    examples: string[];
    sort_order: number;
  }[];
}

export interface FetchResult {
  draft: WiktionaryDraft | null;
  skipReason: string | null;
}

const POS_ORDER = [
  'Verb', 'Noun', 'Adjective', 'Adverb', 'Pronoun', 'Proper noun',
  'Interjection', 'Preposition', 'Conjunction', 'Determiner', 'Article',
  'Numeral', 'Particle', 'Phrase', 'Idiom', 'Proverb', 'Contraction',
  'Affix', 'Prefix', 'Suffix',
];

function posPriority(pos: string): number {
  const idx = POS_ORDER.indexOf(pos);
  return idx === -1 ? 999 : idx;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .trim();
}

function cleanWikitext(s: string): string {
  let t = s;
  let prev = '';
  while (prev !== t) {
    prev = t;
    t = t.replace(/\{\{[^{}]*\}\}/g, '');
  }
  return t
    .replace(/'{2,3}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSimpleWikitext(
  wikitext: string
): Array<{ text: string; sentences: string[]; examples: string[] }> {
  const defs: Array<{ text: string; sentences: string[]; examples: string[] }> = [];
  const lines = wikitext.split('\n');
  let current: { text: string; sentences: string[]; examples: string[] } | null = null;

  for (const line of lines) {
    if (/^# [^:#*]/.test(line) || line === '# ') {
      if (current && current.text) defs.push(current);
      const raw = line.slice(2).trim();
      const text = cleanWikitext(raw);
      if (text) current = { text, sentences: [], examples: [] };
      else current = null;
    } else if (/^#: /.test(line) && current) {
      const example = cleanWikitext(line.slice(3));
      if (example) current.examples.push(example);
    } else if (/^#\*: /.test(line) && current) {
      const example = cleanWikitext(line.slice(4));
      if (example) current.examples.push(example);
    }
  }
  if (current && current.text) defs.push(current);
  return defs.slice(0, 5);
}

async function fetchSimpleWiktionary(
  word: string
): Promise<Array<{ text: string; sentences: string[]; examples: string[] }>> {
  try {
    const url = `https://simple.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Heron-Dictionary/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    const wikitext: string = data?.parse?.wikitext?.['*'] || '';
    if (!wikitext) return [];
    return parseSimpleWikitext(wikitext);
  } catch {
    return [];
  }
}

export async function fetchWiktionaryWord(word: string): Promise<FetchResult> {
  try {
    const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': 'Heron-Dictionary/1.0' },
        signal: AbortSignal.timeout(10000),
      });
    } catch (e: any) {
      if (e.name === 'TimeoutError' || e.name === 'AbortError') {
        return { draft: null, skipReason: 'timeout (en.wiktionary.org)' };
      }
      return { draft: null, skipReason: `network_error: ${e.message}` };
    }

    if (!res.ok) {
      if (res.status === 404) return { draft: null, skipReason: 'not_found_on_wiktionary' };
      if (res.status === 429) return { draft: null, skipReason: 'rate_limited_by_wiktionary' };
      return { draft: null, skipReason: `http_error_${res.status}` };
    }

    const data = (await res.json()) as WiktionaryResponse;
    const english = data['en'];
    if (!english || english.length === 0) {
      return { draft: null, skipReason: 'no_english_entry' };
    }

    const sorted = [...english].sort((a, b) => posPriority(a.partOfSpeech) - posPriority(b.partOfSpeech));
    const substantive = sorted.filter(e => posPriority(e.partOfSpeech) < 999);
    if (substantive.length === 0) {
      const posFound = english.map(e => e.partOfSpeech).join(', ');
      return { draft: null, skipReason: `no_substantive_pos (found: ${posFound})` };
    }

    const primaryEntry = substantive[0];
    const pos = primaryEntry.partOfSpeech;
    const multiplePos = substantive.length > 1;

    const standardDefs: WiktionaryDraft['definitions'] = [];
    let totalStandard = 0;

    for (const entry of substantive) {
      if (totalStandard >= 25) break;
      const rawDefs = entry.definitions || [];
      const entryDefs = rawDefs
        .filter(d => d.definition)
        .map(d => ({
          text: stripHtml(d.definition),
          examples: (d.examples || []).map(stripHtml).filter(Boolean).slice(0, 3),
        }))
        .filter(d => d.text)
        .slice(0, 15);

      for (const d of entryDefs) {
        if (totalStandard >= 25) break;
        const text = multiplePos ? `(${entry.partOfSpeech}) ${d.text}` : d.text;
        standardDefs.push({
          level: 'standard',
          text,
          sentences: [],
          examples: d.examples,
          sort_order: totalStandard,
        });
        totalStandard++;
      }
    }

    if (standardDefs.length === 0) {
      return { draft: null, skipReason: 'no_definitions_extracted' };
    }

    const simpleDefs = await fetchSimpleWiktionary(word);
    const basicDefs: WiktionaryDraft['definitions'] = simpleDefs.map((d, i) => ({
      level: 'basic',
      text: d.text,
      sentences: d.sentences,
      examples: d.examples,
      sort_order: i,
    }));

    const definitions: WiktionaryDraft['definitions'] = [
      ...basicDefs,
      ...standardDefs,
    ];

    return {
      draft: {
        word: word.toLowerCase(),
        part_of_speech: pos,
        etymology: '',
        synonyms: [],
        related_words: [],
        idioms: [],
        usage_notes: '',
        hasBasicFromSimple: basicDefs.length > 0,
        definitions,
      },
      skipReason: null,
    };
  } catch (e: any) {
    return { draft: null, skipReason: `error: ${e.message}` };
  }
}
