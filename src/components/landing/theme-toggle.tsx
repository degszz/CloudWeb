'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('cw-theme') as 'dark' | 'light' | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cw-theme', next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
      className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] opacity-60 transition-opacity hover:opacity-100"
      style={{ cursor: 'pointer' }}
    >
      {theme === 'dark' ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '1px solid currentColor',
              background: 'currentColor',
            }}
          />
          dark
        </>
      ) : (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '1px solid currentColor',
            }}
          />
          light
        </>
      )}
    </button>
  );
}
