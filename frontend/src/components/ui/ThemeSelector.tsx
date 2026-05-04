import { useState, useRef, useEffect } from 'preact/hooks';
import { Palette, Check, Plus, Trash2, Edit2 } from 'lucide-preact';
import { useTheme } from '../../contexts/ThemeContext';
import { BUILT_IN_THEME_KEYS } from '../../lib/themes';

interface ThemeSelectorProps {
  onOpenEditor?: (key?: string) => void;
}

export function ThemeSelector({ onOpenEditor }: ThemeSelectorProps) {
  const { themeKey, allThemes, activeTheme, setActiveTheme, deleteCustomTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const builtIns = allThemes.filter(t => BUILT_IN_THEME_KEYS.has(t.key));
  const customs = allThemes.filter(t => !BUILT_IN_THEME_KEYS.has(t.key));

  return (
    <div class="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-bg-elevated border border-border text-text-secondary hover:text-text-primary hover:border-brand transition-colors"
        title="Change theme"
      >
        <span
          class="w-3 h-3 rounded-full border border-border flex-shrink-0"
          style={{ background: activeTheme.tokens.brand }}
        />
        <Palette size={14} />
        <span class="hidden sm:inline max-w-24 truncate">{activeTheme.name}</span>
      </button>

      {open && (
        <div class="absolute right-0 mt-2 w-64 bg-bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div class="px-4 py-3 border-b border-border">
            <p class="text-xs font-semibold text-text-disabled uppercase tracking-wider">Theme</p>
          </div>

          <div class="max-h-72 overflow-y-auto">
            {/* Built-in themes */}
            <div class="px-2 py-1">
              {builtIns.map(theme => (
                <ThemeRow
                  key={theme.key}
                  theme={theme}
                  active={themeKey === theme.key}
                  onSelect={() => { setActiveTheme(theme.key); setOpen(false); }}
                />
              ))}
            </div>

            {/* Custom themes */}
            {customs.length > 0 && (
              <div class="border-t border-border px-2 py-1">
                <p class="px-2 pt-2 pb-1 text-xs text-text-disabled uppercase tracking-wider">Custom</p>
                {customs.map(theme => (
                  <ThemeRow
                    key={theme.key}
                    theme={theme}
                    active={themeKey === theme.key}
                    onSelect={() => { setActiveTheme(theme.key); setOpen(false); }}
                    onEdit={onOpenEditor ? () => { onOpenEditor(theme.key); setOpen(false); } : undefined}
                    onDelete={() => deleteCustomTheme(theme.key)}
                  />
                ))}
              </div>
            )}
          </div>

          {onOpenEditor && (
            <div class="border-t border-border p-2">
              <button
                onClick={() => { onOpenEditor(undefined); setOpen(false); }}
                class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                <Plus size={14} />
                Create custom theme
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThemeRow({ theme, active, onSelect, onEdit, onDelete }: {
  theme: import('../../lib/themes').ThemeDefinition;
  active: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div class={`flex items-center gap-2 px-2 py-1.5 rounded-lg group ${active ? 'bg-brand/10' : 'hover:bg-bg-elevated'} transition-colors`}>
      <button onClick={onSelect} class="flex items-center gap-2 flex-1 min-w-0">
        <span
          class="w-4 h-4 rounded-full border border-border flex-shrink-0"
          style={{ background: theme.tokens.brand }}
        />
        <span class={`text-sm truncate ${active ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
          {theme.name}
        </span>
        {active && <Check size={12} class="text-brand flex-shrink-0 ml-auto" />}
      </button>
      {onEdit && (
        <button onClick={onEdit} class="opacity-0 group-hover:opacity-100 p-1 text-text-disabled hover:text-text-primary transition-all">
          <Edit2 size={12} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} class="opacity-0 group-hover:opacity-100 p-1 text-text-disabled hover:text-danger transition-all">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
