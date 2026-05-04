import { useState, useRef } from 'preact/hooks';
import { Upload, Globe, CheckCircle, FileJson, Cpu, Zap, AlertTriangle, X } from 'lucide-preact';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  adminFetchWiktionary,
  adminImportJson,
  adminGetWordlist,
  adminBatchImport,
  adminTestGemini,
} from '../../api/client';

const GEMINI_KEY = 'heron:geminiKey';

type BulkStatus = 'idle' | 'loading-list' | 'ready' | 'importing' | 'done';

interface BulkResult {
  imported: string[];
  skipped: string[];
  errors: { word: string; error: string }[];
}

export function ImportPanel() {
  // --- Gemini AI Settings ---
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem(GEMINI_KEY) || '');
  const [geminiInput, setGeminiInput] = useState(() => localStorage.getItem(GEMINI_KEY) || '');
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [geminiError, setGeminiError] = useState('');

  // --- Bulk Import ---
  const [bulkCount, setBulkCount] = useState(50);
  const [bulkStatus, setBulkStatus] = useState<BulkStatus>('idle');
  const [wordList, setWordList] = useState<string[]>([]);
  const [wordListMeta, setWordListMeta] = useState<{ totalInList: number; alreadyImported: number; available: number } | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentWord: '' });
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkError, setBulkError] = useState('');
  const bulkAbortRef = useRef(false);

  // --- Single Wiktionary ---
  const [wiktWord, setWiktWord] = useState('');
  const [wiktLoading, setWiktLoading] = useState(false);
  const [wiktResult, setWiktResult] = useState<any>(null);
  const [wiktError, setWiktError] = useState('');

  // --- JSON Import ---
  const [jsonResult, setJsonResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function saveGeminiKey() {
    localStorage.setItem(GEMINI_KEY, geminiInput);
    setGeminiKey(geminiInput);
    setGeminiStatus('idle');
    setGeminiError('');
  }

  async function testGeminiKey() {
    if (!geminiInput.trim()) return;
    setGeminiTesting(true);
    setGeminiStatus('idle');
    setGeminiError('');
    try {
      const result = await adminTestGemini(geminiInput.trim());
      if (result.ok) {
        setGeminiStatus('ok');
        saveGeminiKey();
      } else {
        setGeminiStatus('error');
        setGeminiError(result.error || 'Test failed');
      }
    } catch (e: any) {
      setGeminiStatus('error');
      setGeminiError(e.message);
    } finally {
      setGeminiTesting(false);
    }
  }

  async function loadWordList() {
    setBulkStatus('loading-list');
    setBulkError('');
    setBulkResult(null);
    try {
      const data = await adminGetWordlist(bulkCount);
      setWordList(data.words);
      setWordListMeta({ totalInList: data.totalInList, alreadyImported: data.alreadyImported, available: data.available });
      setBulkStatus('ready');
    } catch (e: any) {
      setBulkError(e.message);
      setBulkStatus('idle');
    }
  }

  async function startBulkImport() {
    if (wordList.length === 0) return;
    bulkAbortRef.current = false;
    setBulkStatus('importing');
    setBulkProgress({ current: 0, total: wordList.length, currentWord: '' });
    setBulkResult(null);

    const result: BulkResult = { imported: [], skipped: [], errors: [] };
    const CHUNK = 10;

    for (let i = 0; i < wordList.length; i += CHUNK) {
      if (bulkAbortRef.current) break;
      const chunk = wordList.slice(i, i + CHUNK);
      setBulkProgress({ current: i, total: wordList.length, currentWord: chunk[0] });
      try {
        const r = await adminBatchImport(chunk, geminiKey || undefined);
        result.imported.push(...r.imported);
        result.skipped.push(...r.skipped);
        result.errors.push(...r.errors);
      } catch (e: any) {
        result.errors.push(...chunk.map(w => ({ word: w, error: e.message })));
      }
    }

    setBulkProgress(p => ({ ...p, current: wordList.length }));
    setBulkResult(result);
    setBulkStatus('done');
  }

  function cancelBulk() {
    bulkAbortRef.current = true;
    setBulkStatus('done');
  }

  async function handleWiktionary(e: Event) {
    e.preventDefault();
    if (!wiktWord.trim()) return;
    setWiktLoading(true); setWiktError(''); setWiktResult(null);
    try {
      const data = await adminFetchWiktionary(wiktWord.trim());
      setWiktResult(data);
    } catch (e: any) { setWiktError(e.message); }
    finally { setWiktLoading(false); }
  }

  async function handleJsonUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    setJsonLoading(true); setJsonError(''); setJsonResult(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await adminImportJson(Array.isArray(data) ? data : [data]);
      setJsonResult(result);
    } catch (e: any) { setJsonError(e.message || 'Invalid JSON'); }
    finally { setJsonLoading(false); }
  }

  const progressPct = bulkProgress.total > 0
    ? Math.round((bulkProgress.current / bulkProgress.total) * 100)
    : 0;

  return (
    <div class="max-w-2xl space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Import</h2>
        <p class="text-text-secondary mt-1 text-sm">
          Fetch from Wiktionary, bulk import top words, or upload a JSON file.
        </p>
      </div>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <Cpu size={18} class="text-brand" />
          <h3 class="text-lg font-semibold text-text-primary">AI Settings (Gemini)</h3>
          {geminiKey && <span class="ml-auto text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">Key saved</span>}
        </CardHeader>
        <CardBody className="space-y-4">
          <p class="text-sm text-text-secondary">
            Optional: Add a Gemini API key to automatically generate <strong>Basic</strong> (when Simple Wiktionary doesn't have the word) and <strong>Advanced</strong> definitions during import. Get a free key at{' '}
            <a href="https://aistudio.google.com" target="_blank" rel="noopener" class="text-brand underline">aistudio.google.com</a>.
          </p>
          <div class="flex gap-3">
            <input
              type="password"
              value={geminiInput}
              onInput={e => setGeminiInput((e.target as HTMLInputElement).value)}
              placeholder="AIza..."
              class="flex-1 bg-bg-base border border-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand placeholder-text-disabled font-mono text-sm"
            />
            <Button variant="secondary" onClick={testGeminiKey} disabled={geminiTesting || !geminiInput.trim()}>
              {geminiTesting ? 'Testing...' : 'Test & Save'}
            </Button>
          </div>
          {geminiStatus === 'ok' && (
            <div class="flex items-center gap-2 text-success text-sm">
              <CheckCircle size={16} /> API key valid and saved
            </div>
          )}
          {geminiStatus === 'error' && (
            <div class="flex items-center gap-2 text-danger text-sm">
              <AlertTriangle size={16} /> {geminiError}
            </div>
          )}
          {!geminiKey && (
            <p class="text-text-disabled text-xs">
              Without a Gemini key, basic definitions will come from Simple English Wiktionary only. Words not found there will have no basic definition until manually edited.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Bulk Import */}
      <Card>
        <CardHeader>
          <Zap size={18} class="text-brand" />
          <h3 class="text-lg font-semibold text-text-primary">Bulk Wiktionary Import</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <p class="text-sm text-text-secondary">
            Import the top N most common English words from Wiktionary. Standard definitions come from English Wiktionary, Basic from Simple English Wiktionary
            {geminiKey ? ', and Advanced from Gemini AI.' : '. Add a Gemini key above for Advanced definitions.'}
            {' '}Already-imported words are skipped.
          </p>

          {bulkStatus === 'idle' && (
            <div class="flex gap-3 items-center">
              <select
                value={bulkCount}
                onChange={e => setBulkCount(parseInt((e.target as HTMLSelectElement).value))}
                class="bg-bg-base border border-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {[25, 50, 100, 250, 500].map(n => (
                  <option key={n} value={n}>{n} words</option>
                ))}
              </select>
              <Button onClick={loadWordList}>
                <Globe size={16} /> Preview List
              </Button>
            </div>
          )}

          {bulkStatus === 'loading-list' && (
            <div class="flex items-center gap-2 text-text-secondary text-sm">
              <div class="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              Loading word list...
            </div>
          )}

          {bulkStatus === 'ready' && wordListMeta && (
            <div class="space-y-4">
              <div class="bg-bg-base border border-border rounded-lg p-4 space-y-2">
                <div class="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span>📋 <strong class="text-text-primary">{wordList.length}</strong> words to import</span>
                  <span>✅ <strong class="text-text-primary">{wordListMeta.alreadyImported}</strong> already in dictionary</span>
                  <span>📚 <strong class="text-text-primary">{wordListMeta.available - wordList.length}</strong> more available</span>
                </div>
                {wordList.length > 0 && (
                  <div class="mt-2 text-xs text-text-disabled font-mono bg-bg-surface rounded px-3 py-2 max-h-20 overflow-y-auto">
                    {wordList.join(', ')}
                  </div>
                )}
              </div>
              <div class="flex gap-3">
                <Button onClick={startBulkImport} disabled={wordList.length === 0}>
                  <Zap size={16} /> Start Import{geminiKey ? ' with AI' : ''}
                </Button>
                <Button variant="secondary" onClick={() => { setBulkStatus('idle'); setWordList([]); setWordListMeta(null); }}>
                  Change Count
                </Button>
              </div>
            </div>
          )}

          {bulkStatus === 'importing' && (
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-text-secondary">
                  Processing: <span class="text-text-primary font-mono">{bulkProgress.currentWord || '...'}</span>
                </span>
                <span class="text-text-secondary">{bulkProgress.current} / {bulkProgress.total}</span>
              </div>
              <div class="w-full bg-bg-base rounded-full h-3 overflow-hidden">
                <div
                  class="h-3 bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-disabled text-xs">{progressPct}% complete</span>
                <button onClick={cancelBulk} class="text-xs text-danger hover:underline flex items-center gap-1">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          )}

          {bulkStatus === 'done' && bulkResult && (
            <div class="space-y-3">
              <div class="bg-bg-base border border-border rounded-lg p-4 space-y-2">
                <div class="flex items-center gap-2 text-success text-sm font-medium">
                  <CheckCircle size={16} /> Import complete
                </div>
                <div class="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span>✅ Imported: <strong class="text-success">{bulkResult.imported.length}</strong></span>
                  <span>⏭ Skipped: <strong class="text-warning">{bulkResult.skipped.length}</strong></span>
                  <span>❌ Errors: <strong class="text-danger">{bulkResult.errors.length}</strong></span>
                </div>
                {bulkResult.errors.length > 0 && (
                  <details class="text-xs text-danger mt-2">
                    <summary class="cursor-pointer">Show errors ({bulkResult.errors.length})</summary>
                    <ul class="mt-1 space-y-0.5">
                      {bulkResult.errors.map((e, i) => (
                        <li key={i}><span class="font-mono">{e.word}</span>: {e.error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <Button variant="secondary" onClick={() => { setBulkStatus('idle'); setWordList([]); setWordListMeta(null); setBulkResult(null); }}>
                Import More
              </Button>
            </div>
          )}

          {bulkError && (
            <div class="bg-danger/10 border border-danger/40 text-danger rounded-lg px-4 py-3 text-sm">
              {bulkError}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Single Wiktionary fetch */}
      <Card>
        <CardHeader>
          <Globe size={18} class="text-brand" />
          <h3 class="text-lg font-semibold text-text-primary">Fetch Single Word</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <p class="text-sm text-text-secondary">
            Fetch a single word from Wiktionary. Gets all definitions, Simple English Wiktionary basic definitions, and saves to the dictionary.
          </p>
          <form onSubmit={handleWiktionary} class="flex gap-3">
            <input
              type="text"
              value={wiktWord}
              onInput={e => setWiktWord((e.target as HTMLInputElement).value)}
              placeholder="Enter a word..."
              class="flex-1 bg-bg-base border border-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand placeholder-text-disabled"
            />
            <Button type="submit" disabled={wiktLoading || !wiktWord.trim()}>
              <Globe size={16} />{wiktLoading ? 'Fetching...' : 'Fetch'}
            </Button>
          </form>
          {wiktError && <div class="bg-danger/10 border border-danger/40 text-danger rounded-lg px-4 py-3 text-sm">{wiktError}</div>}
          {wiktResult && (
            <div class="bg-bg-base border border-border rounded-lg p-4 space-y-2">
              <div class="flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle size={16} /> Imported "{wiktResult.word}"
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                <span>POS: <strong>{wiktResult.part_of_speech || '—'}</strong></span>
                <span>Standard defs: <strong>{wiktResult.definitions?.filter((d: any) => d.level === 'standard').length || 0}</strong></span>
                <span>Basic: <strong>{wiktResult.hasBasicFromSimple ? '✓ from Simple Wiktionary' : '— not found'}</strong></span>
              </div>
              <p class="text-text-disabled text-xs">Go to Dashboard → Edit to add Advanced definitions or refine existing ones.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* JSON import */}
      <Card>
        <CardHeader>
          <FileJson size={18} class="text-brand" />
          <h3 class="text-lg font-semibold text-text-primary">Import from JSON</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <p class="text-sm text-text-secondary">
            Upload a JSON file containing an array of word objects (word, part_of_speech, etymology, definitions array with level/text/sentences/examples).
          </p>
          <div
            class="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={28} class="mx-auto text-text-disabled mb-2" />
            <p class="text-text-secondary text-sm">Click to select a JSON file</p>
            <p class="text-text-disabled text-xs mt-1">or drag and drop</p>
            <input ref={fileRef} type="file" accept=".json" onChange={handleJsonUpload} class="hidden" />
          </div>
          {jsonLoading && (
            <div class="flex items-center gap-2 text-text-secondary text-sm">
              <div class="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Importing...
            </div>
          )}
          {jsonError && <div class="bg-danger/10 border border-danger/40 text-danger rounded-lg px-4 py-3 text-sm">{jsonError}</div>}
          {jsonResult && (
            <div class="bg-bg-base border border-border rounded-lg p-4 space-y-2">
              <div class="flex items-center gap-2 text-success text-sm font-medium"><CheckCircle size={16} /> Import complete</div>
              <p class="text-text-secondary text-sm">Imported: <strong>{jsonResult.imported}</strong> · Skipped: <strong>{jsonResult.skipped}</strong></p>
              {jsonResult.errors.length > 0 && (
                <details class="text-xs text-danger">
                  <summary class="cursor-pointer">Show errors ({jsonResult.errors.length})</summary>
                  <ul class="mt-1 space-y-1">{jsonResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
                </details>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
