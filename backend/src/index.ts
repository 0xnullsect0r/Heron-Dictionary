import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import db from './db';
import wordsRouter from './routes/words';
import adminRouter, { importWords } from './routes/admin';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

app.get('/_health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

app.use('/api/words', wordsRouter);
app.use('/api/admin', adminRouter);

// Seed the database if empty
function seedIfEmpty() {
  const count = (db.prepare('SELECT COUNT(*) as n FROM words').get() as any).n;
  if (count === 0) {
    const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
    if (fs.existsSync(seedPath)) {
      const words = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      const result = importWords(words);
      console.log(`Seeded database with ${result.imported} words`);
    }
  }
}
seedIfEmpty();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Heron Dictionary API running on port ${PORT}`);
});
