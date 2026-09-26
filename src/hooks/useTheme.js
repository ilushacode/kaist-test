// src/hooks/useTheme.js
import { useEffect, useState } from 'react';
import { useStore } from './useStore';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

export const useTheme = () => {
  const theme = useStore((s) => s.theme ?? 'auto');
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MEDIA_QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    const handler = (e) => setSystemDark(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const resolved = theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const prev = root.dataset.theme;

    const apply = () => {
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute(
          'content',
          resolved === 'dark' ? '#0f1216' : '#f2f5fb'
        );
      }
    };

    // Первый рендер — просто ставим тему, без анимации
    if (!prev) {
      apply();
      return;
    }

    // Ничего не менялось — ничего не делаем
    if (prev === resolved) return;

    // Есть View Transitions API — используем его
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(apply);
      return;
    }

    // Fallback: мгновенно
    apply();
  }, [resolved]);

  return resolved;
};