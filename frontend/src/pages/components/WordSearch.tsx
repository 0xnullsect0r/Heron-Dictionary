import { useState, useEffect, useRef } from 'preact/hooks';
import { Search, X } from 'lucide-preact';
import { WordSummary } from '../../types/dictionary';
import { searchWords } from '../../api/client';

interface WordSearchProps {
  onSelect: (word: string) => void;
}

export function WordSearch({ onSelect }: WordSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WordSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchWords(query);
        setResults(data);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelect(word: string) {
    setQuery('');
    setOpen(false);
    onSelect(word);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && query.trim()) { handleSelect(query.trim().toLowerCase()); }
  }

  return (
    <div class="relative w-full max-w-xl">
      <div class="relative">
        <Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onInput={e => setQuery((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a word..."
          class="w-full bg-bg-surface border border-border text-text-primary rounded-xl pl-11 pr-10 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-text-disabled"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }} class="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary">
            <X size={16} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div class="absolute z-50 w-full mt-2 bg-bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r.word)}
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-elevated transition-colors border-b border-border/50 last:border-0"
            >
              <span class="text-text-primary font-medium">{r.word}</span>
              <span class="text-text-disabled text-xs italic">{r.part_of_speech}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

