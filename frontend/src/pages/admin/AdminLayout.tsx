import { ComponentChildren } from 'preact';
import { BookOpen, LayoutDashboard, Plus, Upload, LogOut } from 'lucide-preact';

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
  function isActive(item: typeof navItems[0]) {
    return item.exact ? currentPath === item.path : currentPath.startsWith(item.path) && currentPath !== '/admin';
  }

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-800 border-r border-navy-700 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-navy-700">
          <BookOpen size={20} className="text-electric-500" />
          <span className="ml-2 text-white font-bold">Heron</span>
          <span className="ml-2 text-xs font-semibold text-electric-400 uppercase tracking-wider">Admin</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = isActive(item);
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                  active
                    ? 'bg-electric-600/20 text-electric-400 border border-electric-700/40'
                    : 'text-gray-400 hover:bg-navy-700 hover:text-gray-100'
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-700">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:bg-navy-700 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-navy-800 border-b border-navy-700 flex items-center px-6">
          <h1 className="text-lg font-semibold text-white">Heron Dictionary Admin</h1>
          <div className="ml-auto flex items-center gap-3">
            <a href="/" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">← View Dictionary</a>
            <div className="w-8 h-8 rounded-full bg-electric-600 flex items-center justify-center text-white text-sm font-bold">A</div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
