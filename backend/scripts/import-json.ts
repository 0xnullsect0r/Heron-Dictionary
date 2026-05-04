import fs from 'fs';
import path from 'path';
import { importWords } from '../src/routes/admin';

const file = process.argv[2];
if (!file) {
  console.error('Usage: tsx scripts/import-json.ts <path-to-json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.resolve(file), 'utf-8'));
const results = importWords(Array.isArray(data) ? data : [data]);
console.log(`Imported: ${results.imported}, Skipped: ${results.skipped}`);
if (results.errors.length) console.error('Errors:', results.errors);
