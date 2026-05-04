'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Read from DOM (set by inline script) so we stay in sync
    const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    if (current) setTheme(current);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nw-theme', next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
      style={{
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.04em',
        textTransform: 'uppercase' as const,
        color: 'inherit',
        opacity: 0.7,
        transition: 'opacity 0.2s',
        padding: 0,
      }}
      className="nav-link"
    >
      <span
        style={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '1px solid currentColor',
          background: theme === 'dark' ? 'currentColor' : 'transparent',
          transition: 'background 0.2s',
        }}
      />
      {theme === 'dark' ? 'dark' : 'light'}
    </button>
  );
}
