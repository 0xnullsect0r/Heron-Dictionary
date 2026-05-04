import { useState } from 'preact/hooks';
import { Save, X, Plus, Trash2, BookOpen, ChevronDown, ChevronRight } from 'lucide-preact';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { WordEntry, Level } from '../../types/dictionary';
import { adminCreateWord, adminUpdateWord, adminUpsertDefinition } from '../../api/client';

interface WordEditorProps {
  word?: WordEntry;
  onSave: () => void;
  onCancel: () => void;
}

type LevelDraft = {
  text: string;
  sentences: string[];
  examples: string[];
};

const defaultLevels = (): Record<Level, LevelDraft> => ({
  basic: { text: '', sentences: [''], examples: [''] },
  standard: { text: '', sentences: [''], examples: [''] },
  advanced: { text: '', sentences: [''], examples: [''] },
});

function wordToLevels(word: WordEntry): Record<Level, LevelDraft> {
  const levels = defaultLevels();
  for (const def of word.definitions) {
    levels[def.level] = {
      text: def.text,
      sentences: def.sentences.length ? def.sentences : [''],
      examples: def.examples.length ? def.examples : [''],
    };
  }
  return levels;
}

export function WordEditor({ word, onSave, onCancel }: WordEditorProps) {
  const [wordText, setWordText] = useState(word?.word || '');
  const [pos, setPos] = useState(word?.part_of_speech || '');
  const [etymology, setEtymology] = useState(word?.etymology || '');
  const [usageNotes, setUsageNotes] = useState(word?.usage_notes || '');
  const [synonyms, setSynonyms] = useState<string[]>(word?.synonyms?.length ? word.synonyms : ['']);
  const [relatedWords, setRelatedWords] = useState<string[]>(word?.related_words?.length ? word.related_words : ['']);
  const [idioms, setIdioms] = useState<{ phrase: string; meaning: string }[]>(
    word?.idioms?.length ? word.idioms : [{ phrase: '', meaning: '' }]
  );
  const [levels, setLevels] = useState<Record<Level, LevelDraft>>(word ? wordToLevels(word) : defaultLevels());
  const [expandedLevel, setExpandedLevel] = useState<Level | ''>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateLevel(level: Level, field: keyof LevelDraft, value: string | string[]) {
    setLevels(prev => ({ ...prev, [level]: { ...prev[level], [field]: value } }));
  }

  function addListItem(setter: (v: string[]) => void, list: string[]) {
    setter([...list, '']);
  }

  function removeListItem(setter: (v: string[]) => void, list: string[], idx: number) {
    setter(list.filter((_, i) => i !== idx));
  }

  function updateListItem(setter: (v: string[]) => void, list: string[], idx: number, val: string) {
    const next = [...list]; next[idx] = val; setter(next);
  }

  async function handleSave(e: Event) {
    e.preventDefault();
    if (!wordText.trim()) { setError('Word is required'); return; }
    setSaving(true);
    setError('');
    try {
      let wordId = word?.id;
      const payload = {
        word: wordText.toLowerCase().trim(),
        part_of_speech: pos,
        etymology,
        usage_notes: usageNotes,
        synonyms: synonyms.filter(Boolean),
        related_words: relatedWords.filter(Boolean),
        idioms: idioms.filter(i => i.phrase),
      };

      if (wordId) {
        await adminUpdateWord(wordId, payload);
      } else {
        const result = await adminCreateWord(payload);
        wordId = result.id;
      }

      for (const [levelKey, draft] of Object.entries(levels)) {
        if (!draft.text.trim()) continue;
        await adminUpsertDefinition({
          word_id: wordId,
          level: levelKey,
          text: draft.text,
          sentences: draft.sentences.filter(Boolean),
          examples: draft.examples.filter(Boolean),
          sort_order: 0,
        });
      }
      onSave();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const levelColors: Record<Level, string> = {
    basic: 'text-blue-400',
    standard: 'text-electric-400',
    advanced: 'text-purple-400',
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{word ? `Edit: ${word.word}` : 'Add new word'}</h2>
          <p className="text-gray-400 mt-1 text-sm">Fill in all three definition levels for a fully cleared word entry.</p>
        </div>
        <Button variant="ghost" onClick={onCancel}><X size={18} /></Button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core fields */}
        <Card>
          <CardHeader>
            <BookOpen size={18} className="text-electric-400" />
            <h3 className="text-lg font-semibold text-white">Word details</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Word</label>
                <input
                  type="text"
                  value={wordText}
                  onInput={e => setWordText((e.target as HTMLInputElement).value)}
                  disabled={!!word}
                  className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-electric-500 disabled:opacity-50 font-mono"
                  placeholder="enter word"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Part of speech</label>
                <input
                  type="text"
                  value={pos}
                  onInput={e => setPos((e.target as HTMLInputElement).value)}
                  className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500"
                  placeholder="noun, verb, adjective..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Etymology (origin / derivation)</label>
              <textarea
                value={etymology}
                onInput={e => setEtymology((e.target as HTMLTextAreaElement).value)}
                rows={3}
                className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500 resize-y"
                placeholder="From Latin... Originally meaning..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Usage notes</label>
              <textarea
                value={usageNotes}
                onInput={e => setUsageNotes((e.target as HTMLTextAreaElement).value)}
                rows={2}
                className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500 resize-y"
                placeholder="Notes on how the word is used..."
              />
            </div>
          </CardBody>
        </Card>

        {/* Definition levels */}
        {(['basic', 'standard', 'advanced'] as Level[]).map(level => (
          <Card key={level}>
            <button
              type="button"
              onClick={() => setExpandedLevel(expandedLevel === level ? '' : level)}
              className="w-full px-6 py-4 border-b border-navy-700 flex items-center gap-2 hover:bg-navy-700/30 transition-colors"
            >
              {expandedLevel === level ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
              <span className={`text-lg font-semibold capitalize ${levelColors[level]}`}>{level}</span>
              <span className="text-gray-500 text-sm ml-1">definition</span>
              {levels[level].text && <span className="ml-auto text-xs text-green-400">✓ filled</span>}
            </button>
            {expandedLevel === level && (
              <CardBody className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Definition text</label>
                  <textarea
                    value={levels[level].text}
                    onInput={e => updateLevel(level, 'text', (e.target as HTMLTextAreaElement).value)}
                    rows={3}
                    className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500 resize-y"
                    placeholder={level === 'basic' ? 'Plain language definition for anyone...' : level === 'standard' ? 'Dictionary-grade definition...' : 'Full technical/nuanced definition...'}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Example sentences</label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addListItem(v => updateLevel(level, 'sentences', v), levels[level].sentences)}>
                      <Plus size={14} /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {levels[level].sentences.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={s}
                          onInput={e => {
                            const next = [...levels[level].sentences]; next[i] = (e.target as HTMLInputElement).value;
                            updateLevel(level, 'sentences', next);
                          }}
                          className="flex-1 bg-navy-900 border border-navy-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500"
                          placeholder="Write a sentence using the word..."
                        />
                        {levels[level].sentences.length > 1 && (
                          <button type="button" onClick={() => { const next = levels[level].sentences.filter((_, j) => j !== i); updateLevel(level, 'sentences', next); }} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Usage examples</label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => addListItem(v => updateLevel(level, 'examples', v), levels[level].examples)}>
                      <Plus size={14} /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {levels[level].examples.map((ex, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={ex}
                          onInput={e => {
                            const next = [...levels[level].examples]; next[i] = (e.target as HTMLInputElement).value;
                            updateLevel(level, 'examples', next);
                          }}
                          className="flex-1 bg-navy-900 border border-navy-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500"
                          placeholder="Real-world example of usage..."
                        />
                        {levels[level].examples.length > 1 && (
                          <button type="button" onClick={() => { const next = levels[level].examples.filter((_, j) => j !== i); updateLevel(level, 'examples', next); }} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            )}
          </Card>
        ))}

        {/* Synonyms */}
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-white">Synonyms, related words & idioms</h3></CardHeader>
          <CardBody className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Synonyms</label>
                <Button type="button" variant="ghost" size="sm" onClick={() => addListItem(setSynonyms, synonyms)}><Plus size={14} /> Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {synonyms.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 bg-navy-700 rounded-lg px-2 py-1">
                    <input value={s} onInput={e => updateListItem(setSynonyms, synonyms, i, (e.target as HTMLInputElement).value)} className="bg-transparent text-sm text-gray-200 outline-none w-24" placeholder="synonym" />
                    <button type="button" onClick={() => removeListItem(setSynonyms, synonyms, i)} className="text-gray-600 hover:text-red-400"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Related words</label>
                <Button type="button" variant="ghost" size="sm" onClick={() => addListItem(setRelatedWords, relatedWords)}><Plus size={14} /> Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedWords.map((w, i) => (
                  <div key={i} className="flex items-center gap-1 bg-navy-900 border border-navy-700 rounded-lg px-2 py-1">
                    <input value={w} onInput={e => updateListItem(setRelatedWords, relatedWords, i, (e.target as HTMLInputElement).value)} className="bg-transparent text-sm text-gray-400 outline-none w-28" placeholder="related word" />
                    <button type="button" onClick={() => removeListItem(setRelatedWords, relatedWords, i)} className="text-gray-600 hover:text-red-400"><X size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Idioms</label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIdioms([...idioms, { phrase: '', meaning: '' }])}><Plus size={14} /> Add</Button>
              </div>
              <div className="space-y-2">
                {idioms.map((idiom, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input value={idiom.phrase} onInput={e => { const n = [...idioms]; n[i] = { ...n[i], phrase: (e.target as HTMLInputElement).value }; setIdioms(n); }} className="flex-1 bg-navy-900 border border-navy-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500" placeholder="Idiom phrase" />
                    <input value={idiom.meaning} onInput={e => { const n = [...idioms]; n[i] = { ...n[i], meaning: (e.target as HTMLInputElement).value }; setIdioms(n); }} className="flex-1 bg-navy-900 border border-navy-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 placeholder-gray-500" placeholder="Meaning" />
                    {idioms.length > 1 && <button type="button" onClick={() => setIdioms(idioms.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 mt-2"><Trash2 size={14} /></button>}
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex gap-3 pb-6">
          <Button type="submit" disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save word'}</Button>
          <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        </div>
      </form>
    </div>
  );
}
