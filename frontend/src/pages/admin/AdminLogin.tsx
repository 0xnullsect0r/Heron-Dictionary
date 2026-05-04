import { useState } from 'preact/hooks';
import { BookOpen } from 'lucide-preact';

interface AdminLoginProps {
  onLogin: (password: string) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) { setError('Invalid password.'); return; }
      if (!res.ok) { setError('Server error.'); return; }
      sessionStorage.setItem('admin_password', password);
      onLogin(password);
    } catch { setError('Could not reach the server.'); }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen size={32} className="text-electric-500" />
            <span className="text-2xl font-bold text-white">Heron Dictionary</span>
          </div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-1 text-sm">Sign in to manage the dictionary</p>
        </div>
        <div className="bg-navy-800 border border-navy-700 rounded-xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Admin password</label>
              <input
                type="password"
                value={password}
                onInput={e => setPassword((e.target as HTMLInputElement).value)}
                required
                className="w-full bg-navy-900 border border-navy-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-electric-500 focus:border-transparent placeholder-gray-500"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-electric-600 hover:bg-electric-500 text-white font-semibold rounded-lg px-4 py-2.5 transition-colors">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
