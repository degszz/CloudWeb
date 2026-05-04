'use client';

import dynamic from 'next/dynamic';

export const ThemeToggleLazy = dynamic(
  () => import('./theme-toggle').then(m => m.ThemeToggle),
  { ssr: false, loading: () => null }
);
