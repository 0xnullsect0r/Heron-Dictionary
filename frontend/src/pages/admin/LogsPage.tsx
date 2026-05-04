import { useState, useEffect } from 'preact/hooks';
import { adminGetLogs, adminGetLogDetail } from '../../api/client';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { FileText, ChevronDown, ChevronRight, CheckCircle, XCircle, SkipForward, Bot, AlertCircle } from 'lucide-preact';

interface ImportSession {
  id: number;
  timestamp: string;
  type: string;
  total_requested: number;
  total_imported: number;
  total_skipped: number;
  total_errors: number;
}

interface ImportEvent {
  id: number;
  word: string;
  status: string;
  skip_reason: string | null;
  definitions_count: number;
  ai_used: number;
  error_message: string | null;
  timestamp: string;
}

interface AILog {
  id: number;
  timestamp: string;
  model: string;
  words: string;
  status: string;
  error_message: string | null;
  duration_ms: number;
}

interface SessionDetail {
  session: ImportSession;
  events: ImportEvent[];
  aiLogs: AILog[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'imported') return (
    <span class="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
      <CheckCircle size={10} /> imported
    </span>
  );
  if (status === 'skipped') return (
    <span class="inline-flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
      <SkipForward size={10} /> skipped
    </span>
  );
  return (
    <span class="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
      <XCircle size={10} /> error
    </span>
  );
}

function SessionRow({ session, onExpand, expanded }: { session: ImportSession; onExpand: () => void; expanded: boolean }) {
  const date = new Date(session.timestamp + 'Z').toLocaleString();
  const typeColors: Record<string, string> = {
    bulk: 'text-blue-400 bg-blue-400/10',
    single: 'text-purple-400 bg-purple-400/10',
    json: 'text-teal-400 bg-teal-400/10',
  };

  return (
    <tr class="border-b border-border hover:bg-bg-elevated/50 cursor-pointer" onClick={onExpand}>
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} class="text-text-disabled" /> : <ChevronRight size={14} class="text-text-disabled" />}
          <span class="text-sm font-mono text-text-primary">#{session.id}</span>
        </div>
      </td>
      <td class="px-4 py-3 text-sm text-text-secondary">{date}</td>
      <td class="px-4 py-3">
        <span class={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[session.type] || 'text-text-disabled bg-bg-elevated'}`}>
          {session.type}
        </span>
      </td>
      <td class="px-4 py-3 text-sm text-text-secondary text-right">{session.total_requested}</td>
      <td class="px-4 py-3 text-sm text-green-400 text-right font-medium">{session.total_imported}</td>
      <td class="px-4 py-3 text-sm text-yellow-400 text-right">{session.total_skipped}</td>
      <td class="px-4 py-3 text-sm text-red-400 text-right">{session.total_errors}</td>
    </tr>
  );
}

function SessionDetailRow({ id }: { id: number }) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [tab, setTab] = useState<'words' | 'ai'>('words');
  const [filter, setFilter] = useState<'all' | 'imported' | 'skipped' | 'error'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminGetLogDetail(id).then(d => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <tr><td colSpan={7} class="px-4 py-4 text-center text-text-disabled text-sm">Loading details…</td></tr>
  );
  if (!detail) return (
    <tr><td colSpan={7} class="px-4 py-4 text-center text-red-400 text-sm">Failed to load details</td></tr>
  );

  const filtered = filter === 'all' ? detail.events : detail.events.filter(e => e.status === filter);

  return (
    <tr>
      <td colSpan={7} class="px-4 py-0">
        <div class="border border-border rounded-lg mb-4 bg-bg-elevated overflow-hidden">
          {/* Tabs */}
          <div class="flex border-b border-border">
            <button
              onClick={() => setTab('words')}
              class={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === 'words' ? 'text-brand border-b-2 border-brand' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Word Events ({detail.events.length})
            </button>
            <button
              onClick={() => setTab('ai')}
              class={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'ai' ? 'text-brand border-b-2 border-brand' : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Bot size={14} /> AI Requests ({detail.aiLogs.length})
            </button>
          </div>

          {tab === 'words' && (
            <div>
              {/* Filter bar */}
              <div class="flex gap-2 px-4 py-3 border-b border-border">
                {(['all', 'imported', 'skipped', 'error'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    class={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === f ? 'bg-brand/20 text-brand' : 'bg-bg-base text-text-secondary hover:text-text-primary'}`}
                  >
                    {f === 'all' ? `All (${detail.events.length})` :
                     f === 'imported' ? `✅ Imported (${detail.events.filter(e => e.status === 'imported').length})` :
                     f === 'skipped' ? `⏭ Skipped (${detail.events.filter(e => e.status === 'skipped').length})` :
                     `❌ Errors (${detail.events.filter(e => e.status === 'error').length})`}
                  </button>
                ))}
              </div>

              <div class="overflow-auto max-h-96">
                <table class="w-full text-sm">
                  <thead class="bg-bg-base/50 text-text-disabled text-xs uppercase tracking-wider">
                    <tr>
                      <th class="px-4 py-2 text-left">Word</th>
                      <th class="px-4 py-2 text-left">Status</th>
                      <th class="px-4 py-2 text-left">Skip Reason / Note</th>
                      <th class="px-4 py-2 text-right">Defs</th>
                      <th class="px-4 py-2 text-left">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(ev => (
                      <tr key={ev.id} class="border-t border-border/50 hover:bg-bg-base/30">
                        <td class="px-4 py-2 font-mono text-text-primary">{ev.word}</td>
                        <td class="px-4 py-2"><StatusBadge status={ev.status} /></td>
                        <td class="px-4 py-2 text-text-secondary text-xs">
                          {ev.skip_reason || ev.error_message || <span class="text-text-disabled">—</span>}
                        </td>
                        <td class="px-4 py-2 text-right text-text-secondary">{ev.definitions_count || '—'}</td>
                        <td class="px-4 py-2">
                          {ev.ai_used ? <span class="text-xs text-purple-400 flex items-center gap-1"><Bot size={10} /> AI</span> : <span class="text-text-disabled text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} class="px-4 py-4 text-center text-text-disabled">No events</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div class="overflow-auto max-h-96">
              {detail.aiLogs.length === 0 ? (
                <p class="px-4 py-6 text-center text-text-disabled text-sm">No AI requests in this session</p>
              ) : (
                <table class="w-full text-sm">
                  <thead class="bg-bg-base/50 text-text-disabled text-xs uppercase tracking-wider">
                    <tr>
                      <th class="px-4 py-2 text-left">Time</th>
                      <th class="px-4 py-2 text-left">Model</th>
                      <th class="px-4 py-2 text-left">Words in Batch</th>
                      <th class="px-4 py-2 text-left">Status</th>
                      <th class="px-4 py-2 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.aiLogs.map(log => {
                      let wordsArr: string[] = [];
                      try { wordsArr = JSON.parse(log.words); } catch {}
                      return (
                        <tr key={log.id} class="border-t border-border/50">
                          <td class="px-4 py-2 text-text-secondary text-xs">{new Date(log.timestamp + 'Z').toLocaleTimeString()}</td>
                          <td class="px-4 py-2 font-mono text-xs text-purple-300">{log.model}</td>
                          <td class="px-4 py-2">
                            <div class="flex flex-wrap gap-1 max-w-xs">
                              {wordsArr.map(w => (
                                <span key={w} class="text-xs bg-bg-base px-1.5 py-0.5 rounded text-text-secondary font-mono">{w}</span>
                              ))}
                            </div>
                          </td>
                          <td class="px-4 py-2">
                            {log.status === 'success'
                              ? <span class="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={10} /> success</span>
                              : <span class="text-xs text-red-400 flex items-center gap-1" title={log.error_message || ''}><AlertCircle size={10} /> error</span>
                            }
                          </td>
                          <td class="px-4 py-2 text-right text-text-secondary text-xs">
                            {log.duration_ms != null ? `${(log.duration_ms / 1000).toFixed(1)}s` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export function LogsPage() {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const limit = 20;

  function load(p: number) {
    setLoading(true);
    adminGetLogs(p, limit)
      .then(d => { setSessions(d.sessions); setTotal(d.total); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page]);

  function toggle(id: number) {
    setExpandedId(prev => prev === id ? null : id);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-text-primary">Import Logs</h2>
          <p class="text-sm text-text-secondary mt-0.5">Detailed history of all import sessions and AI requests</p>
        </div>
        <button onClick={() => load(page)} class="px-3 py-1.5 text-sm bg-bg-elevated border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors">
          Refresh
        </button>
      </div>

      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <FileText size={18} class="text-brand" />
            <span>Import Sessions</span>
            <span class="ml-auto text-xs text-text-disabled">{total} total</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div class="px-6 py-12 text-center text-text-disabled">Loading…</div>
          ) : sessions.length === 0 ? (
            <div class="px-6 py-12 text-center text-text-disabled">
              <FileText size={32} class="mx-auto mb-3 opacity-30" />
              <p class="text-sm">No import sessions yet</p>
              <p class="text-xs mt-1">Import some words to see logs here</p>
            </div>
          ) : (
            <>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-bg-elevated/50 border-b border-border text-text-disabled text-xs uppercase tracking-wider">
                    <tr>
                      <th class="px-4 py-3 text-left">Session</th>
                      <th class="px-4 py-3 text-left">Date</th>
                      <th class="px-4 py-3 text-left">Type</th>
                      <th class="px-4 py-3 text-right">Requested</th>
                      <th class="px-4 py-3 text-right">Imported</th>
                      <th class="px-4 py-3 text-right">Skipped</th>
                      <th class="px-4 py-3 text-right">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <>
                        <SessionRow
                          key={s.id}
                          session={s}
                          expanded={expandedId === s.id}
                          onExpand={() => toggle(s.id)}
                        />
                        {expandedId === s.id && <SessionDetailRow id={s.id} />}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div class="flex justify-center gap-2 p-4 border-t border-border">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    class="px-3 py-1.5 text-sm rounded border border-border text-text-secondary disabled:opacity-40 hover:bg-bg-elevated transition-colors"
                  >← Prev</button>
                  <span class="px-3 py-1.5 text-sm text-text-disabled">{page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    class="px-3 py-1.5 text-sm rounded border border-border text-text-secondary disabled:opacity-40 hover:bg-bg-elevated transition-colors"
                  >Next →</button>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
