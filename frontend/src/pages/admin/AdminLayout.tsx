import { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { BookOpen, LayoutDashboard, Plus, Upload, LogOut } from 'lucide-preact';
import { ThemeSelector } from '../../components/ui/ThemeSelector';
import { ThemeEditor } from '../../components/ui/ThemeEditor';

interface AdminLayoutProps {
  children: ComponentChildren;
  onLogout: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/new', label: 'Add Word', icon: Plus, exact: false },
  { path: '/admin/import', label: 'Import', icon: Upload, exact: false },
];

export function AdminLayout({ children, onLogout, currentPath, onNavigate }: AdminLayoutProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState<string | undefined>();

  function isActive(item: typeof navItems[0]) {
    return item.exact ? currentPath === item.path : currentPath.startsWith(item.path) && currentPath !== '/admin';
  }

  function openEditor(key?: string) { setEditorKey(key); setEditorOpen(true); }

  return (
    <div class="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside class="w-64 bg-bg-surface border-r border-border flex flex-col fixed inset-y-0 left-0 z-10">
        <div class="h-16 flex items-center px-6 border-b border-border">
          <BookOpen size={20} class="text-brand" />
          <span class="ml-2 text-text-primary font-bold">Heron</span>
          <span class="ml-2 text-xs font-semibold text-brand uppercase tracking-wider">Admin</span>
        </div>

        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = isActive(item);
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                class={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                  active
                    ? 'bg-brand/20 text-brand border border-brand/40'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div class="p-4 border-t border-border">
          <button
            onClick={onLogout}
            class="flex items-center space-x-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:text-danger transition-colors"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div class="flex-1 ml-64 flex flex-col min-h-screen">
        <header class="h-16 bg-bg-surface border-b border-border flex items-center px-6">
          <h1 class="text-lg font-semibold text-text-primary">Heron Dictionary Admin</h1>
          <div class="ml-auto flex items-center gap-3">
            <a href="/" class="text-sm text-text-disabled hover:text-text-primary transition-colors">View Dictionary</a>
            <ThemeSelector onOpenEditor={openEditor} />
            <div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-text-primary text-sm font-bold">A</div>
          </div>
        </header>
        <main class="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {editorOpen && <ThemeEditor editKey={editorKey} onClose={() => setEditorOpen(false)} />}
    </div>
  );
}

