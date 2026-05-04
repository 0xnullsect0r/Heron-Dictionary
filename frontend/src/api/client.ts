const BASE = '/api';

function getAdminHeaders(): HeadersInit {
  const pw = sessionStorage.getItem('admin_password') || '';
  return { 'Content-Type': 'application/json', 'x-admin-password': pw };
}

export async function searchWords(q: string) {
  const res = await fetch(`${BASE}/words?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getWord(word: string) {
  const res = await fetch(`${BASE}/words/${encodeURIComponent(word)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
}

export async function adminGetWords() {
  const res = await fetch(`${BASE}/admin/words`, { headers: getAdminHeaders() });
  if (res.status === 401) throw new Error('Unauthorized');
  return res.json();
}

export async function adminGetStats() {
  const res = await fetch(`${BASE}/admin/stats`, { headers: getAdminHeaders() });
  return res.json();
}

export async function adminCreateWord(data: object) {
  const res = await fetch(`${BASE}/admin/words`, { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminUpdateWord(id: number, data: object) {
  const res = await fetch(`${BASE}/admin/words/${id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminDeleteWord(id: number) {
  const res = await fetch(`${BASE}/admin/words/${id}`, { method: 'DELETE', headers: getAdminHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminUpsertDefinition(data: object) {
  const res = await fetch(`${BASE}/admin/definitions`, { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminFetchWiktionary(word: string) {
  const res = await fetch(`${BASE}/admin/import/wiktionary/${encodeURIComponent(word)}`, { method: 'POST', headers: getAdminHeaders() });
  if (!res.ok) throw new Error((await res.json()).error || 'Wiktionary fetch failed');
  return res.json();
}

export async function adminImportJson(data: object[]) {
  const res = await fetch(`${BASE}/admin/import/json`, { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminGetWordlist(count: number): Promise<{
  words: string[];
  totalInList: number;
  alreadyImported: number;
  available: number;
}> {
  const res = await fetch(`${BASE}/admin/import/wordlist?count=${count}`, { headers: getAdminHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminBatchImport(
  words: string[],
  geminiApiKey?: string,
  geminiModel?: string
): Promise<{ imported: string[]; skipped: string[]; errors: { word: string; error: string }[] }> {
  const res = await fetch(`${BASE}/admin/import/wiktionary-batch`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ words, geminiApiKey, geminiModel }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminTestGemini(geminiApiKey: string, geminiModel?: string): Promise<{ ok: boolean; sample?: any; error?: string }> {
  const res = await fetch(`${BASE}/admin/import/test-gemini`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ geminiApiKey, geminiModel }),
  });
  return res.json();
}

export async function adminGetLogs(page = 1, limit = 20): Promise<{
  sessions: any[];
  total: number;
  page: number;
  limit: number;
}> {
  const res = await fetch(`${BASE}/admin/logs?page=${page}&limit=${limit}`, { headers: getAdminHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminGetLogDetail(id: number): Promise<{
  session: any;
  events: any[];
  aiLogs: any[];
}> {
  const res = await fetch(`${BASE}/admin/logs/${id}`, { headers: getAdminHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

