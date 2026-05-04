import { useState, useRef } from 'preact/hooks';
import { Upload, Globe, CheckCircle, FileJson } from 'lucide-preact';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminFetchWiktionary, adminImportJson } from '../../api/client';

export function ImportPanel() {
  const [wiktWord, setWiktWord] = useState('');
  const [wiktLoading, setWiktLoading] = useState(false);
  const [wiktResult, setWiktResult] = useState<any>(null);
  const [wiktError, setWiktError] = useState('');

  const [jsonResult, setJsonResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Import</h2>
        <p className="text-text-secondary mt-1 text-sm">Fetch from Wiktionary or bulk import from a JSON file.</p>
      </div>

      {/* Wiktionary fetch */}
      <Card>
        <CardHeader>
          <Globe size={18} className="text-brand" />
          <h3 className="text-lg font-semibold text-text-primary">Fetch from Wiktionary</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-text-secondary">
            Fetches a draft definition from English Wiktionary. The standard definition is pre-filled; you'll need to write the basic and advanced tiers and add sentences.
          </p>
          <form onSubmit={handleWiktionary} className="flex gap-3">
            <input
              type="text"
              value={wiktWord}
              onInput={e => setWiktWord((e.target as HTMLInputElement).value)}
              placeholder="Enter a word..."
              className="flex-1 bg-bg-base border border-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand placeholder-text-disabled"
            />
            <Button type="submit" disabled={wiktLoading || !wiktWord.trim()}>
              <Globe size={16} />{wiktLoading ? 'Fetching...' : 'Fetch'}
            </Button>
          </form>
          {wiktError && <div className="bg-danger/10 border border-danger/40 text-danger rounded-lg px-4 py-3 text-sm">{wiktError}</div>}
          {wiktResult && (
            <div className="bg-bg-base border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle size={16} /> Draft created for "{wiktResult.word}"
              </div>
              <p className="text-text-secondary text-xs">Part of speech: <span className="text-text-secondary">{wiktResult.part_of_speech || '—'}</span></p>
              <p className="text-text-secondary text-xs">Standard definition: <span className="text-text-secondary">{wiktResult.definitions?.find((d: any) => d.level === 'standard')?.text || '—'}</span></p>
              <p className="text-text-disabled text-xs">Note: This draft has been saved. Go to Dashboard → Edit to fill in the basic and advanced tiers and add sentences.</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* JSON import */}
      <Card>
        <CardHeader>
          <FileJson size={18} className="text-brand" />
          <h3 className="text-lg font-semibold text-text-primary">Import from JSON</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-text-secondary">
            Upload a JSON file containing an array of word objects. Each word should follow the dictionary data format (word, part_of_speech, etymology, definitions array with level/text/sentences/examples).
          </p>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={28} className="mx-auto text-text-disabled mb-2" />
            <p className="text-text-secondary text-sm">Click to select a JSON file</p>
            <p className="text-text-disabled text-xs mt-1">or drag and drop</p>
            <input ref={fileRef} type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
          </div>
          {jsonLoading && <div className="flex items-center gap-2 text-text-secondary text-sm"><div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" /> Importing...</div>}
          {jsonError && <div className="bg-danger/10 border border-danger/40 text-danger rounded-lg px-4 py-3 text-sm">{jsonError}</div>}
          {jsonResult && (
            <div className="bg-bg-base border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-success text-sm font-medium"><CheckCircle size={16} /> Import complete</div>
              <p className="text-text-secondary text-sm">Imported: <strong>{jsonResult.imported}</strong> · Skipped: <strong>{jsonResult.skipped}</strong></p>
              {jsonResult.errors.length > 0 && (
                <details className="text-xs text-danger">
                  <summary className="cursor-pointer">Show errors ({jsonResult.errors.length})</summary>
                  <ul className="mt-1 space-y-1">{jsonResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
                </details>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
