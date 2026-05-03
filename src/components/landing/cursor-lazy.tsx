'use client';

import dynamic from 'next/dynamic';

export const CustomCursorLazy = dynamic(
  () => import('./cursor').then(m => m.CustomCursor),
  { ssr: false, loading: () => null }
);
