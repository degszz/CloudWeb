'use client';

import dynamic from 'next/dynamic';

export const LuaChatLazy = dynamic(
  () => import('./lua-chat').then(m => m.LuaChat),
  { ssr: false, loading: () => null }
);
