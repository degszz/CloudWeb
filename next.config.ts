import type { NextConfig } from 'next';

/**
 * CloudWeb publica los sitios de los usuarios en {slug}.cloudweb.app
 *
 * El routing por subdominio se resuelve en `src/middleware.ts`,
 * que reescribe `{slug}.cloudweb.app/*` → `/(public)/[slug]/*`.
 *
 * En local: usa http://{slug}.localhost:3000 (los navegadores
 * modernos resuelven *.localhost al loopback automáticamente).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Imágenes externas de Unsplash, Pexels y otros stocks comunes.
  // Decisión #6: aceptamos URLs externas en MVP, sin Supabase Storage.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },

  experimental: {
    // Streaming de Server Actions para el chat del agente
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Headers de seguridad básicos (refuerza vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
