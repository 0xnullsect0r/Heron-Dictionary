import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'heron.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE NOT NULL COLLATE NOCASE,
    part_of_speech TEXT DEFAULT '',
    etymology TEXT DEFAULT '',
    idioms TEXT DEFAULT '[]',
    synonyms TEXT DEFAULT '[]',
    related_words TEXT DEFAULT '[]',
    usage_notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK(level IN ('basic','standard','advanced')),
    text TEXT NOT NULL DEFAULT '',
    sentences TEXT DEFAULT '[]',
    examples TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
  CREATE INDEX IF NOT EXISTS idx_definitions_word_id ON definitions(word_id);
  CREATE INDEX IF NOT EXISTS idx_definitions_level ON definitions(level);
`);

export default db;
