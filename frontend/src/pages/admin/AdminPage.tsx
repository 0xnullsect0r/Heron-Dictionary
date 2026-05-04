import { useState } from 'preact/hooks';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { WordEditor } from './WordEditor';
import { ImportPanel } from './ImportPanel';
import { LogsPage } from './LogsPage';
import { WordEntry } from '../../types/dictionary';

type AdminView = 'dashboard' | 'new' | 'edit' | 'import' | 'logs';

interface AdminPageProps {
  path?: string;
}

export function AdminPage({ path = '/admin' }: AdminPageProps) {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('admin_password'));
  const [view, setView] = useState<AdminView>('dashboard');
  const [editWord, setEditWord] = useState<WordEntry | undefined>();

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_password');
    setAuthed(false);
  }

  function handleNavigate(p: string) {
    if (p === '/admin/new') setView('new');
    else if (p === '/admin/import') setView('import');
    else if (p === '/admin/logs') setView('logs');
    else { setView('dashboard'); setEditWord(undefined); }
  }

  function getViewPath() {
    if (view === 'new') return '/admin/new';
    if (view === 'import') return '/admin/import';
    if (view === 'edit') return '/admin/edit';
    if (view === 'logs') return '/admin/logs';
    return '/admin';
  }

  return (
    <AdminLayout onLogout={handleLogout} currentPath={getViewPath()} onNavigate={handleNavigate}>
      {view === 'dashboard' && (
        <AdminDashboard
          onEditWord={(w) => { setEditWord(w); setView('edit'); }}
          onNewWord={() => { setEditWord(undefined); setView('new'); }}
        />
      )}
      {(view === 'new' || view === 'edit') && (
        <WordEditor
          word={editWord}
          onSave={() => { setView('dashboard'); setEditWord(undefined); }}
          onCancel={() => { setView('dashboard'); setEditWord(undefined); }}
        />
      )}
      {view === 'import' && <ImportPanel />}
      {view === 'logs' && <LogsPage />}
    </AdminLayout>
  );
}

