import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/words?q=searchterm  — search suggestions
router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) {
    const rows = db.prepare('SELECT id, word, part_of_speech FROM words ORDER BY word ASC LIMIT 50').all();
    return res.json(rows);
  }
  const rows = db.prepare(
    "SELECT id, word, part_of_speech FROM words WHERE word LIKE ? ORDER BY CASE WHEN word = ? THEN 0 ELSE 1 END, word ASC LIMIT 20"
  ).all(`${q}%`, q);
  res.json(rows);
});

// GET /api/words/:word — full word entry with all definitions
router.get('/:word', (req, res) => {
  const word = db.prepare('SELECT * FROM words WHERE word = ? COLLATE NOCASE').get(req.params.word);
  if (!word) return res.status(404).json({ error: 'Word not found' });

  const definitions = db.prepare(
    'SELECT * FROM definitions WHERE word_id = ? ORDER BY level, sort_order'
  ).all((word as any).id);

  const parse = (field: string) => {
    try { return JSON.parse(field); } catch { return []; }
  };

  res.json({
    ...(word as any),
    idioms: parse((word as any).idioms),
    synonyms: parse((word as any).synonyms),
    related_words: parse((word as any).related_words),
    definitions: definitions.map((d: any) => ({
      ...d,
      sentences: parse(d.sentences),
      examples: parse(d.examples),
    })),
  });
});

export default router;
