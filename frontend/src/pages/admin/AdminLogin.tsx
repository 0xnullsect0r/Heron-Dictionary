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
    <div class="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="flex items-center justify-center gap-3 mb-4">
            <BookOpen size={32} class="text-brand" />
            <span class="text-2xl font-bold text-text-primary">Heron Dictionary</span>
          </div>
          <h1 class="text-xl font-bold text-text-primary">Admin Panel</h1>
          <p class="text-text-secondary mt-1 text-sm">Sign in to manage the dictionary</p>
        </div>
        <div class="bg-bg-surface border border-border rounded-xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} class="space-y-5">
            {error && (
              <div class="bg-danger/10 border border-danger/40 text-danger rounded-lg px-4 py-3 text-sm">{error}</div>
            )}
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-1.5">Admin password</label>
              <input
                type="password"
                value={password}
                onInput={e => setPassword((e.target as HTMLInputElement).value)}
                required
                class="w-full bg-bg-base border border-border text-text-primary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-text-disabled"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" class="w-full bg-brand hover:bg-brand-hover text-text-primary font-semibold rounded-lg px-4 py-2.5 transition-colors">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

