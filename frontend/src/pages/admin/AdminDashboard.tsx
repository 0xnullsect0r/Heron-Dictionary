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
    { label: 'Total words', value: stats.total, icon: BookOpen, color: 'text-electric-400' },
    { label: 'Fully defined', value: stats.fullyDefined, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Incomplete', value: stats.incomplete, icon: AlertCircle, color: 'text-yellow-400' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 mt-1 text-sm">Manage your dictionary words and definitions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={load} size="sm"><RefreshCw size={14} /> Refresh</Button>
          <Button onClick={onNewWord} size="sm"><BookOpen size={14} /> Add Word</Button>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardBody className="flex items-center gap-4">
                <s.icon size={28} className={s.color} />
                <div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-gray-400 text-sm">{s.label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Word list */}
      <Card>
        <CardHeader>
          <BookOpen size={18} className="text-electric-400" />
          <h3 className="text-lg font-semibold text-white flex-1">Words</h3>
          <input
            type="text"
            value={search}
            onInput={e => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Filter words..."
            className="bg-navy-900 border border-navy-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 w-48"
          />
        </CardHeader>
        <div className="divide-y divide-navy-700">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No words found.</div>
          ) : (
            filtered.map(w => (
              <div key={w.id} className="px-6 py-4 flex items-center justify-between hover:bg-navy-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white font-medium">{w.word}</p>
                    <p className="text-gray-500 text-xs italic">{w.part_of_speech}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${w.definition_count >= 3 ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-yellow-900/40 text-yellow-400 border border-yellow-800'}`}>
                    {w.definition_count}/3 levels
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEditWord(w)}><Edit size={14} /></Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(w.id, w.word)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Recent activity */}
      {stats && stats.recent.length > 0 && (
        <Card>
          <CardHeader>
            <Clock size={18} className="text-electric-400" />
            <h3 className="text-lg font-semibold text-white">Recently updated</h3>
          </CardHeader>
          <CardBody className="space-y-2">
            {stats.recent.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{r.word}</span>
                <span className="text-gray-500 font-mono text-xs">{new Date(r.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
