import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cloudweb.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/terms', '/privacy', '/cookies'],
        disallow: ['/dashboard', '/builder', '/settings', '/api/', '/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
