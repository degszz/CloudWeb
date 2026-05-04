import type { Metadata } from 'next';
import Script from 'next/script';
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
    default: 'nuweb — Habla. Publica.',
    template: '%s · nuweb',
  },
  description:
    'Tu sitio web, creado en conversación. Cuéntale a Lúa de qué va tu negocio y en minutos tenés una primera versión. Ajustás hablando. Publicás en un clic.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    title: 'nuweb — Habla. Publica.',
    description: 'Tu sitio web, creado en conversación.',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: '/api/og?title=Tu%20sitio%2C%20creado%20en%20conversación.',
        width: 1200,
        height: 630,
        alt: 'nuweb — Tu sitio web, creado en conversación',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'nuweb — Habla. Publica.',
    description: 'Tu sitio web, creado en conversación.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function(){
            var t = localStorage.getItem('nw-theme');
            if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', t);
          })();
        `}</Script>
      </head>
      <body>
        <PosthogProvider>{children}</PosthogProvider>
      </body>
    </html>
  );
}
