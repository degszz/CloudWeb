import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';

import { PosthogProvider } from '@/lib/analytics/posthog';

import './globals.css';

/**
 * Fuentes según minimalist_ui §3.
 *
 * - Geist Sans: cuerpo y UI
 * - Instrument Serif: titulares editoriales
 * - Geist Mono: código, atajos, metadatos
 *
 * Self-hosted vía next/font/google → sin requests al CDN de Google
 * en runtime (privacy-first + carga rápida).
 */
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

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CloudWeb',
    template: '%s · CloudWeb',
  },
  description:
    'Tu sitio web, creado en conversación. CloudWeb traduce lo que cuentas en una web profesional, publicada en un clic.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    title: 'CloudWeb',
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
    title: 'CloudWeb',
    description: 'Tu sitio web, creado en conversación.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <PosthogProvider>{children}</PosthogProvider>
      </body>
    </html>
  );
}
