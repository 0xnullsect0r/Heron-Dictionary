import { useState, useEffect } from 'preact/hooks';
import { X, Save, Copy } from 'lucide-preact';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ThemeDefinition, ThemeTokenKey, THEME_TOKEN_KEYS, TOKEN_LABELS,
  emptyCustomTheme, BUILT_IN_THEMES,
} from '../../lib/themes';

interface ThemeEditorProps {
  editKey?: string;
  onClose: () => void;
}

const TOKEN_GROUPS: { label: string; keys: ThemeTokenKey[] }[] = [
  { label: 'Backgrounds', keys: ['bgBase', 'bgSurface', 'bgElevated', 'bgHover'] },
  { label: 'Brand', keys: ['brand', 'brandHover', 'brandMuted'] },
  { label: 'Text', keys: ['textPrimary', 'textSecondary', 'textDisabled'] },
  { label: 'Status', keys: ['danger', 'warning', 'success'] },
  { label: 'Border', keys: ['border'] },
];

export function ThemeEditor({ editKey, onClose }: ThemeEditorProps) {
  const { allThemes, saveCustomTheme } = useTheme();

  const [draft, setDraft] = useState<ThemeDefinition>(() => {
    if (editKey) {
      const found = allThemes.find(t => t.key === editKey);
      if (found) return { ...found, tokens: { ...found.tokens } };
    }
    return emptyCustomTheme();
  });

  const [nameError, setNameError] = useState('');

  // Live preview: apply the draft as we edit
  useEffect(() => {
    const root = document.documentElement;
    for (const key of THEME_TOKEN_KEYS) {
      root.style.setProperty(`--color-${kebab(key)}`, draft.tokens[key]);
    }
    root.setAttribute('data-theme', '__editor_preview__');
    return () => { /* cleanup handled by ThemeContext on close */ };
  }, [draft.tokens]);

  function kebab(k: ThemeTokenKey): string {
    return k.replace(/([A-Z])/g, m => '-' + m.toLowerCase());
  }

  function updateToken(key: ThemeTokenKey, value: string) {
    setDraft(d => ({ ...d, tokens: { ...d.tokens, [key]: value } }));
  }

  function handleSave() {
    if (!draft.name.trim()) { setNameError('Name is required'); return; }
    setNameError('');
    saveCustomTheme(draft);
    onClose();
  }

  function copyFromPreset(key: string) {
    const preset = BUILT_IN_THEMES.find(t => t.key === key);
    if (preset) setDraft(d => ({ ...d, tokens: { ...preset.tokens } }));
  }

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 class="text-lg font-bold text-text-primary">
            {editKey ? 'Edit Theme' : 'Create Custom Theme'}
          </h2>
          <button onClick={onClose} class="p-1.5 rounded-lg text-text-disabled hover:text-text-primary hover:bg-bg-elevated transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div class="space-y-1">
            <label class="text-xs font-semibold text-text-disabled uppercase tracking-wider">Theme Name</label>
            <input
              type="text"
              value={draft.name}
              onInput={e => setDraft(d => ({ ...d, name: (e.target as HTMLInputElement).value }))}
              placeholder="My awesome theme"
              class="w-full bg-bg-base border border-border text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand placeholder-text-disabled"
            />
            {nameError && <p class="text-xs text-danger">{nameError}</p>}
          </div>

          {/* Copy from preset */}
          <div class="space-y-1">
            <label class="text-xs font-semibold text-text-disabled uppercase tracking-wider flex items-center gap-1.5">
              <Copy size={12} /> Copy from preset
            </label>
            <div class="flex flex-wrap gap-2">
              {BUILT_IN_THEMES.map(t => (
                <button
                  key={t.key}
                  onClick={() => copyFromPreset(t.key)}
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-border bg-bg-elevated text-text-secondary hover:border-brand hover:text-text-primary transition-colors"
                >
                  <span class="w-2.5 h-2.5 rounded-full" style={{ background: t.tokens.brand }} />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color tokens */}
          {TOKEN_GROUPS.map(group => (
            <div key={group.label} class="space-y-3">
              <h3 class="text-xs font-semibold text-text-disabled uppercase tracking-wider border-b border-border pb-1">{group.label}</h3>
              <div class="grid grid-cols-2 gap-3">
                {group.keys.map(key => (
                  <div key={key} class="flex items-center gap-3">
                    <input
                      type="color"
                      value={draft.tokens[key]}
                      onInput={e => updateToken(key, (e.target as HTMLInputElement).value)}
                      class="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5 flex-shrink-0"
                      title={TOKEN_LABELS[key]}
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-text-secondary">{TOKEN_LABELS[key]}</p>
                      <input
                        type="text"
                        value={draft.tokens[key]}
                        onInput={e => {
                          const v = (e.target as HTMLInputElement).value;
                          if (/^#[0-9a-fA-F]{0,8}$/.test(v)) updateToken(key, v);
                        }}
                        class="w-full bg-bg-base border border-border text-text-primary rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand mt-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} class="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors border border-border">
            Cancel
          </button>
          <button
            onClick={handleSave}
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand hover:bg-brand-hover text-text-primary transition-colors"
          >
            <Save size={14} /> Save Theme
          </button>
        </div>
      </div>
    </div>
  );
}
