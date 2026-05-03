import type { Metadata } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

import { PosthogProvider } from '@/lib/analytics/posthog';

import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: 'variable',
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CloudWeb — Habla. Publica.',
    template: '%s · CloudWeb',
  },
  description:
    'Tu sitio web, creado en conversación. Cuéntale a Lúa de qué va tu negocio y en minutos tenés una primera versión. Ajustás hablando. Publicás en un clic.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    title: 'CloudWeb — Habla. Publica.',
    description: 'Tu sitio web, creado en conversación.',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: '/api/og?title=Tu%20sitio%2C%20creado%20en%20conversación.',
        width: 1200,
        height: 630,
        alt: 'CloudWeb — Tu sitio web, creado en conversación',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CloudWeb — Habla. Publica.',
    description: 'Tu sitio web, creado en conversación.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}
    >
      <body>
        <PosthogProvider>{children}</PosthogProvider>
      </body>
    </html>
  );
}
