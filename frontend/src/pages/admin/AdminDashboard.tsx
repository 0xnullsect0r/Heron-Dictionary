import { useState, useEffect } from 'preact/hooks';
import { BookOpen, CheckCircle, AlertCircle, Clock, RefreshCw, Edit, Trash2 } from 'lucide-preact';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminGetStats, adminGetWords, adminDeleteWord } from '../../api/client';
import { AdminStats, WordEntry } from '../../types/dictionary';

interface AdminDashboardProps {
  onEditWord: (word: WordEntry) => void;
  onNewWord: () => void;
}

export function AdminDashboard({ onEditWord, onNewWord }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [words, setWords] = useState<(WordEntry & { definition_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([adminGetStats(), adminGetWords()]);
      setStats(s);
      setWords(w);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number, word: string) {
    if (!confirm(`Delete "${word}"?`)) return;
    await adminDeleteWord(id);
    load();
  }

  const filtered = words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()));

  const statCards = stats ? [
    { label: 'Total words', value: stats.total, icon: BookOpen, color: 'text-brand' },
    { label: 'Fully defined', value: stats.fullyDefined, icon: CheckCircle, color: 'text-success' },
    { label: 'Incomplete', value: stats.incomplete, icon: AlertCircle, color: 'text-warning' },
  ] : [];

  return (
    <div class="space-y-8">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-text-primary">Dashboard</h2>
          <p class="text-text-secondary mt-1 text-sm">Manage your dictionary words and definitions.</p>
        </div>
        <div class="flex gap-3">
          <Button variant="secondary" onClick={load} size="sm"><RefreshCw size={14} /> Refresh</Button>
          <Button onClick={onNewWord} size="sm"><BookOpen size={14} /> Add Word</Button>
        </div>
      </div>

      {stats && (
        <div class="grid grid-cols-3 gap-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-4">
                <s.icon size={28} class={s.color} />
                <div>
                  <p class="text-2xl font-bold text-text-primary">{s.value}</p>
                  <p class="text-text-secondary text-sm">{s.label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <BookOpen size={18} class="text-brand" />
          <h3 class="text-lg font-semibold text-text-primary flex-1">Words</h3>
          <input
            type="text"
            value={search}
            onInput={e => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Filter words..."
            class="bg-bg-base border border-border text-text-primary rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand w-48"
          />
        </CardHeader>
        <div class="divide-y divide-border">
          {loading ? (
            <div class="flex justify-center py-12">
              <div class="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div class="p-6 text-center text-text-disabled text-sm">No words found.</div>
          ) : (
            filtered.map(w => (
              <div key={w.id} class="px-6 py-4 flex items-center justify-between hover:bg-bg-elevated/30 transition-colors">
                <div class="flex items-center gap-4">
                  <div>
                    <p class="text-text-primary font-medium">{w.word}</p>
                    <p class="text-text-disabled text-xs italic">{w.part_of_speech}</p>
                  </div>
                  <span class={`text-xs px-2 py-0.5 rounded-full ${w.definition_count >= 3 ? 'bg-success/10 text-success border border-success/30' : 'bg-warning/10 text-warning border border-warning/30'}`}>
                    {w.definition_count}/3 levels
                  </span>
                </div>
                <div class="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEditWord(w)}><Edit size={14} /></Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(w.id, w.word)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {stats && stats.recent.length > 0 && (
        <Card>
          <CardHeader>
            <Clock size={18} class="text-brand" />
            <h3 class="text-lg font-semibold text-text-primary">Recently updated</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            {stats.recent.map((r, i) => (
              <div key={i} class="flex items-center justify-between text-sm">
                <span class="text-text-secondary">{r.word}</span>
                <span class="text-text-disabled font-mono text-xs">{new Date(r.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

