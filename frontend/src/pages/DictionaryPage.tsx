import { useState } from 'preact/hooks';
import { BookOpen } from 'lucide-preact';
import { WordSearch } from './components/WordSearch';
import { WordEntry } from './components/WordEntry';
import { WordEntry as WordEntryType } from '../types/dictionary';
import { getWord } from '../api/client';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { ThemeEditor } from '../components/ui/ThemeEditor';

export function DictionaryPage(_props: { path?: string; default?: boolean }) {
  const [entry, setEntry] = useState<WordEntryType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState<string | undefined>();

  async function handleSelect(word: string) {
    setLoading(true);
    setError('');
    try {
      const data = await getWord(word);
      if (!data) setError(`"${word}" was not found in the dictionary.`);
      else setEntry(data);
    } catch { setError('Failed to load word.'); }
    finally { setLoading(false); }
  }

  function openEditor(key?: string) { setEditorKey(key); setEditorOpen(true); }

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="bg-bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-brand" />
            <span className="text-xl font-bold text-text-primary">Heron Dictionary</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSelector onOpenEditor={openEditor} />
            <a href="/admin" className="text-text-disabled hover:text-text-primary text-sm transition-colors">Admin</a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary">Look up a word</h2>
            <p className="text-text-secondary mt-2 text-sm">Definitions at three levels of depth — basic, standard, and advanced.</p>
          </div>
          <WordSearch onSelect={handleSelect} />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {error && !loading && (
          <div className="bg-danger/10 border border-danger/40 rounded-xl p-5 text-danger text-sm">{error}</div>
        )}

        {entry && !loading && <WordEntry entry={entry} />}

        {!entry && !loading && !error && (
          <div className="text-center py-16 text-text-disabled">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Search for a word to get started.</p>
          </div>
        )}
      </main>

      {editorOpen && <ThemeEditor editKey={editorKey} onClose={() => setEditorOpen(false)} />}
    </div>
  );
}

