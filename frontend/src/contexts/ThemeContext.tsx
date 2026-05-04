import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import { ComponentChildren } from 'preact';
import {
  applyTheme, BUILT_IN_THEMES, BUILT_IN_THEME_KEYS,
  DEFAULT_THEME_KEY, findBuiltInTheme,
  ThemeDefinition,
} from '../lib/themes';

interface ThemeContextValue {
  themeKey: string;
  customThemes: ThemeDefinition[];
  allThemes: ThemeDefinition[];
  activeTheme: ThemeDefinition;
  setActiveTheme: (key: string) => void;
  saveCustomTheme: (theme: ThemeDefinition) => void;
  deleteCustomTheme: (key: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LOCAL_THEME_KEY = 'heron:themeKey';
const LOCAL_CUSTOM_KEY = 'heron:customThemes';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeLocal(key: string, value: unknown): void {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function ThemeProvider({ children }: { children: ComponentChildren }) {
  const [themeKey, setThemeKey] = useState<string>(() => readLocal<string>(LOCAL_THEME_KEY, DEFAULT_THEME_KEY));
  const [customThemes, setCustomThemes] = useState<ThemeDefinition[]>(() =>
    readLocal<ThemeDefinition[]>(LOCAL_CUSTOM_KEY, [])
  );

  const allThemes = useMemo<ThemeDefinition[]>(
    () => [...BUILT_IN_THEMES, ...customThemes],
    [customThemes],
  );

  const activeTheme = useMemo<ThemeDefinition>(() => {
    return allThemes.find(t => t.key === themeKey) ?? findBuiltInTheme(DEFAULT_THEME_KEY)!;
  }, [themeKey, allThemes]);

  useEffect(() => { applyTheme(activeTheme); }, [activeTheme]);

  const setActiveTheme = useCallback((key: string) => {
    const exists = BUILT_IN_THEME_KEYS.has(key) || customThemes.some(t => t.key === key);
    const next = exists ? key : DEFAULT_THEME_KEY;
    setThemeKey(next);
    writeLocal(LOCAL_THEME_KEY, next);
  }, [customThemes]);

  const saveCustomTheme = useCallback((theme: ThemeDefinition) => {
    setCustomThemes(prev => {
      const idx = prev.findIndex(t => t.key === theme.key);
      const next = idx === -1 ? [...prev, theme] : prev.map((t, i) => i === idx ? theme : t);
      writeLocal(LOCAL_CUSTOM_KEY, next);
      return next;
    });
    setThemeKey(theme.key);
    writeLocal(LOCAL_THEME_KEY, theme.key);
  }, []);

  const deleteCustomTheme = useCallback((key: string) => {
    setCustomThemes(prev => {
      const next = prev.filter(t => t.key !== key);
      writeLocal(LOCAL_CUSTOM_KEY, next);
      return next;
    });
    if (themeKey === key) {
      setThemeKey(DEFAULT_THEME_KEY);
      writeLocal(LOCAL_THEME_KEY, DEFAULT_THEME_KEY);
    }
  }, [themeKey]);

  const value = useMemo<ThemeContextValue>(() => ({
    themeKey, customThemes, allThemes, activeTheme,
    setActiveTheme, saveCustomTheme, deleteCustomTheme,
  }), [themeKey, customThemes, allThemes, activeTheme, setActiveTheme, saveCustomTheme, deleteCustomTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
