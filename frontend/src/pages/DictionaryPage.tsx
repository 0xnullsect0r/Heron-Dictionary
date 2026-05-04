import { useState } from 'preact/hooks';
import { BookOpen } from 'lucide-preact';
import { WordSearch } from './components/WordSearch';
import { WordEntry } from './components/WordEntry';
import { WordEntry as WordEntryType } from '../types/dictionary';
import { getWord } from '../api/client';

export function DictionaryPage() {
  const [entry, setEntry] = useState<WordEntryType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-800 border-b border-navy-700">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-electric-500" />
            <span className="text-xl font-bold text-white">Heron Dictionary</span>
          </div>
          <a href="/admin" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Admin</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Search */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Look up a word</h2>
            <p className="text-gray-400 mt-2 text-sm">Definitions at three levels of depth — basic, standard, and advanced.</p>
          </div>
          <WordSearch onSelect={handleSelect} />
        </div>

        {/* Result */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-5 text-red-300 text-sm">{error}</div>
        )}

        {entry && !loading && <WordEntry entry={entry} />}

        {!entry && !loading && !error && (
          <div className="text-center py-16 text-gray-600">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Search for a word to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}
