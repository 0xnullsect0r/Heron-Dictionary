import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { fetchWiktionaryWord, WiktionaryDraft } from '../wiktionary';
import { generateDefinitions } from '../gemini';
import { WORD_LIST } from '../data/wordlist';

const router = Router();

// Simple password guard
function adminGuard(req: Request, res: Response, next: NextFunction) {
  if (process.env.ADMIN_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Admin disabled' });
  }
  const auth = req.headers['x-admin-password'];
  if (auth !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /api/admin/words — list all words with completion status
router.get('/words', adminGuard, (_req, res) => {
  const words = db.prepare('SELECT * FROM words ORDER BY word ASC').all();
  const counts = db.prepare(
    'SELECT word_id, COUNT(*) as count FROM definitions GROUP BY word_id'
  ).all() as { word_id: number; count: number }[];
  const countMap = Object.fromEntries(counts.map(c => [c.word_id, c.count]));
  res.json((words as any[]).map(w => ({
    ...w,
    definition_count: countMap[w.id] || 0,
    idioms: tryParse(w.idioms),
    synonyms: tryParse(w.synonyms),
    related_words: tryParse(w.related_words),
  })));
});

// GET /api/admin/stats
router.get('/stats', adminGuard, (_req, res) => {
  const total = (db.prepare('SELECT COUNT(*) as n FROM words').get() as any).n;
  const fullyDefined = (db.prepare(
    `SELECT COUNT(*) as n FROM words w WHERE (
      SELECT COUNT(DISTINCT level) FROM definitions WHERE word_id = w.id AND text != ''
    ) = 3`
  ).get() as any).n;
  const recent = db.prepare('SELECT word, updated_at FROM words ORDER BY updated_at DESC LIMIT 10').all();
  res.json({ total, fullyDefined, incomplete: total - fullyDefined, recent });
});

// POST /api/admin/words — create word
router.post('/words', adminGuard, (req, res) => {
  const { word, part_of_speech = '', etymology = '', idioms = [], synonyms = [], related_words = [], usage_notes = '' } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required' });
  try {
    const result = db.prepare(
      `INSERT INTO words (word, part_of_speech, etymology, idioms, synonyms, related_words, usage_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(word.toLowerCase(), part_of_speech, etymology, JSON.stringify(idioms), JSON.stringify(synonyms), JSON.stringify(related_words), usage_notes);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Word already exists' });
    throw e;
  }
});

// PUT /api/admin/words/:id — update word
router.put('/words/:id', adminGuard, (req, res) => {
  const { part_of_speech, etymology, idioms, synonyms, related_words, usage_notes } = req.body;
  db.prepare(
    `UPDATE words SET part_of_speech=?, etymology=?, idioms=?, synonyms=?, related_words=?, usage_notes=?, updated_at=datetime('now') WHERE id=?`
  ).run(part_of_speech, etymology, JSON.stringify(idioms || []), JSON.stringify(synonyms || []), JSON.stringify(related_words || []), usage_notes, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/admin/words/:id
router.delete('/words/:id', adminGuard, (req, res) => {
  db.prepare('DELETE FROM words WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/definitions — upsert a definition
router.post('/definitions', adminGuard, (req, res) => {
  const { word_id, level, text, sentences = [], examples = [], sort_order = 0 } = req.body;
  const existing = db.prepare('SELECT id FROM definitions WHERE word_id=? AND level=?').get(word_id, level);
  if (existing) {
    db.prepare('UPDATE definitions SET text=?, sentences=?, examples=?, sort_order=? WHERE word_id=? AND level=?')
      .run(text, JSON.stringify(sentences), JSON.stringify(examples), sort_order, word_id, level);
  } else {
    db.prepare('INSERT INTO definitions (word_id, level, text, sentences, examples, sort_order) VALUES (?,?,?,?,?,?)')
      .run(word_id, level, text, JSON.stringify(sentences), JSON.stringify(examples), sort_order);
  }
  res.json({ ok: true });
});

// DELETE /api/admin/definitions/:id
router.delete('/definitions/:id', adminGuard, (req, res) => {
  db.prepare('DELETE FROM definitions WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/import/wiktionary/:word — fetch draft from Wiktionary and save it
router.post('/import/wiktionary/:word', adminGuard, async (req, res) => {
  try {
    const draft = await fetchWiktionaryWord(req.params.word);
    if (!draft) return res.status(404).json({ error: 'Word not found on Wiktionary' });

    // Save the draft into the database
    const result = importWords([draft]);
    if (result.errors.length > 0 && result.imported === 0) {
      return res.status(409).json({ error: result.errors[0] });
    }

    const row = db.prepare('SELECT id FROM words WHERE word=?').get(draft.word) as any;
    const savedWord = db.prepare('SELECT * FROM words WHERE id=?').get(row.id) as any;
    const defs = db.prepare('SELECT * FROM definitions WHERE word_id=? ORDER BY sort_order').all(row.id);
    res.json({ ...draft, id: row.id, definitions: defs, word: savedWord.word });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/import/json — bulk import from JSON array
router.post('/import/json', adminGuard, (req, res) => {
  const words = req.body;
  if (!Array.isArray(words)) return res.status(400).json({ error: 'Expected an array' });
  const results = importWords(words);
  res.json(results);
});

// GET /api/admin/import/wordlist?count=N — returns words not yet in DB
router.get('/import/wordlist', adminGuard, (req, res) => {
  const count = Math.min(parseInt(req.query.count as string) || 50, 500);
  const existing = new Set(
    (db.prepare('SELECT word FROM words').all() as any[]).map((r: any) => r.word.toLowerCase())
  );
  const available = WORD_LIST.filter(w => !existing.has(w.toLowerCase())).slice(0, count);
  res.json({
    words: available,
    totalInList: WORD_LIST.length,
    alreadyImported: existing.size,
    available: WORD_LIST.filter(w => !existing.has(w.toLowerCase())).length,
  });
});

// POST /api/admin/import/wiktionary-batch — bulk import with optional AI
router.post('/import/wiktionary-batch', adminGuard, async (req, res) => {
  const { words, geminiApiKey, geminiModel } = req.body as { words: string[]; geminiApiKey?: string; geminiModel?: string };
  if (!Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: 'words array required' });
  }

  const results = {
    imported: [] as string[],
    skipped: [] as string[],
    errors: [] as { word: string; error: string }[],
  };

  // Fetch Wiktionary for all words, 5 concurrent
  const drafts: WiktionaryDraft[] = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < words.length; i += CONCURRENCY) {
    const chunk = words.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.allSettled(
      chunk.map(word => fetchWiktionaryWord(word).then(d => ({ word, draft: d })))
    );
    for (const r of chunkResults) {
      if (r.status === 'fulfilled') {
        if (r.value.draft) {
          drafts.push(r.value.draft);
        } else {
          results.skipped.push(r.value.word);
        }
      } else {
        const word = words[i + chunkResults.indexOf(r)];
        results.errors.push({ word, error: String(r.reason) });
      }
    }
  }

  // If Gemini key provided, generate basic+advanced for words that need it
  if (geminiApiKey && drafts.length > 0) {
    const needsAI = drafts.filter(d => !d.hasBasicFromSimple);
    const AI_BATCH = 5;

    for (let i = 0; i < needsAI.length; i += AI_BATCH) {
      const batch = needsAI.slice(i, i + AI_BATCH);
      try {
        const inputs = batch.map(d => ({
          word: d.word,
          partOfSpeech: d.part_of_speech,
          standardDefinitions: d.definitions
            .filter(def => def.level === 'standard')
            .slice(0, 5)
            .map(def => def.text),
        }));
        const aiResults = await generateDefinitions(inputs, geminiApiKey, geminiModel);

        for (const ai of aiResults) {
          const draft = needsAI.find(d => d.word === ai.word);
          if (!draft) continue;
          if (ai.basic?.text) {
            draft.definitions.unshift({
              level: 'basic',
              text: ai.basic.text,
              sentences: ai.basic.sentences || [],
              examples: ai.basic.examples || [],
              sort_order: 0,
            });
            draft.hasBasicFromSimple = false; // mark as AI-generated
          }
          if (ai.advanced?.text) {
            draft.definitions.push({
              level: 'advanced',
              text: ai.advanced.text,
              sentences: ai.advanced.sentences || [],
              examples: ai.advanced.examples || [],
              sort_order: 0,
            });
          }
        }
      } catch (e: any) {
        console.error(`Gemini batch error (words ${i}-${i + AI_BATCH}):`, e.message);
        // Continue without AI for this batch
      }
    }

    // Also generate advanced for words that DO have Simple basic (no advanced yet)
    const needsAdvanced = drafts.filter(
      d => d.hasBasicFromSimple && !d.definitions.some(def => def.level === 'advanced')
    );
    for (let i = 0; i < needsAdvanced.length; i += AI_BATCH) {
      const batch = needsAdvanced.slice(i, i + AI_BATCH);
      try {
        const inputs = batch.map(d => ({
          word: d.word,
          partOfSpeech: d.part_of_speech,
          standardDefinitions: d.definitions
            .filter(def => def.level === 'standard')
            .slice(0, 5)
            .map(def => def.text),
        }));
        const aiResults = await generateDefinitions(inputs, geminiApiKey, geminiModel);
        for (const ai of aiResults) {
          const draft = needsAdvanced.find(d => d.word === ai.word);
          if (!draft || !ai.advanced?.text) continue;
          draft.definitions.push({
            level: 'advanced',
            text: ai.advanced.text,
            sentences: ai.advanced.sentences || [],
            examples: ai.advanced.examples || [],
            sort_order: 0,
          });
        }
      } catch (e: any) {
        console.error(`Gemini advanced batch error:`, e.message);
      }
    }
  }

  // Import all drafts, skip words already in DB
  for (const draft of drafts) {
    const existing = db.prepare('SELECT id FROM words WHERE word = ?').get(draft.word.toLowerCase());
    if (existing) {
      results.skipped.push(draft.word);
      continue;
    }
    const r = importWords([draft]);
    if (r.errors.length > 0) {
      results.errors.push({ word: draft.word, error: r.errors[0] });
    } else {
      results.imported.push(draft.word);
    }
  }

  res.json(results);
});

// POST /api/admin/import/test-gemini — test Gemini API key
router.post('/import/test-gemini', adminGuard, async (req, res) => {
  const { geminiApiKey, geminiModel } = req.body;
  if (!geminiApiKey) return res.status(400).json({ error: 'geminiApiKey required' });
  try {
    const results = await generateDefinitions(
      [{ word: 'test', partOfSpeech: 'noun', standardDefinitions: ['A procedure to assess quality'] }],
      geminiApiKey,
      geminiModel
    );
    res.json({ ok: true, sample: results[0] });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export function importWords(words: any[]) {
  let imported = 0, skipped = 0, errors: string[] = [];
  const insertWord = db.prepare(
    `INSERT OR REPLACE INTO words (word, part_of_speech, etymology, idioms, synonyms, related_words, usage_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const upsertDef = db.prepare(
    `INSERT OR REPLACE INTO definitions (word_id, level, text, sentences, examples, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const getWord = db.prepare('SELECT id FROM words WHERE word = ?');

  const run = db.transaction((words: any[]) => {
    for (const w of words) {
      try {
        insertWord.run(
          String(w.word).toLowerCase(),
          w.part_of_speech || '',
          w.etymology || '',
          JSON.stringify(w.idioms || []),
          JSON.stringify(w.synonyms || []),
          JSON.stringify(w.related_words || []),
          w.usage_notes || ''
        );
        const row = getWord.get(String(w.word).toLowerCase()) as any;
        for (const def of (w.definitions || [])) {
          upsertDef.run(row.id, def.level, def.text, JSON.stringify(def.sentences || []), JSON.stringify(def.examples || []), def.sort_order || 0);
        }
        imported++;
      } catch (e: any) {
        errors.push(`${w.word}: ${e.message}`);
        skipped++;
      }
    }
  });
  run(words);
  return { imported, skipped, errors };
}

function tryParse(s: string) {
  try { return JSON.parse(s); } catch { return []; }
}

export default router;
