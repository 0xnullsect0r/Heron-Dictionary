import { Router, Request, Response, NextFunction } from 'express';
import db from '../db';
import { fetchWiktionaryWord } from '../wiktionary';

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
      SELECT COUNT(DISTINCT level) FROM definitions WHERE word_id = w.id
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
