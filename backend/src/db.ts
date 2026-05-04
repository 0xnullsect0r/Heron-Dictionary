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
  CREATE UNIQUE INDEX IF NOT EXISTS idx_def_unique ON definitions(word_id, level, sort_order);

  CREATE TABLE IF NOT EXISTS import_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT (datetime('now')),
    type TEXT NOT NULL,
    total_requested INTEGER DEFAULT 0,
    total_imported INTEGER DEFAULT 0,
    total_skipped INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS import_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    status TEXT NOT NULL,
    skip_reason TEXT,
    definitions_count INTEGER DEFAULT 0,
    ai_used INTEGER DEFAULT 0,
    error_message TEXT,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES import_sessions(id) ON DELETE CASCADE,
    timestamp TEXT DEFAULT (datetime('now')),
    model TEXT NOT NULL,
    words TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    duration_ms INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_import_events_session ON import_events(session_id);
  CREATE INDEX IF NOT EXISTS idx_ai_logs_session ON ai_request_logs(session_id);
`);

export default db;
