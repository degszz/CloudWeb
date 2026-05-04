'use client';

import dynamic from 'next/dynamic';

export const CloudScrollLazy = dynamic(
  () => import('./cloud-scroll').then(m => m.CloudScroll),
  { ssr: false, loading: () => <div style={{ height: '200vh' }} /> }
);
