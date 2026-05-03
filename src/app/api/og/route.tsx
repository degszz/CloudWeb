import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

/**
 * GET /api/og?title=...&subtitle=...
 *
 * Genera una imagen OG dinámica (1200×630) para redes sociales.
 * Estética monocromática editorial alineada con minimalist_ui.
 *
 * Uso en metadata:
 *   openGraph: {
 *     images: [{ url: '/api/og?title=CloudWeb', width: 1200, height: 630 }]
 *   }
 */
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') ?? 'CloudWeb';
  const subtitle =
    searchParams.get('subtitle') ?? 'Tu sitio web, creado en conversación.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#FBFBFA',
          padding: '80px 100px',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: '#78716C',
            marginBottom: 24,
            fontFamily: 'monospace',
          }}
        >
          cloudweb.app
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            maxWidth: '14ch',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#57534E',
            marginTop: 28,
            lineHeight: 1.5,
            maxWidth: '36ch',
          }}
        >
          {subtitle}
        </div>

        {/* Bottom line */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 100,
            right: 100,
            height: 1,
            backgroundColor: '#EAEAEA',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 100,
            fontSize: 14,
            color: '#A8A29E',
            fontFamily: 'monospace',
          }}
        >
          Crea tu web hablando con Lúa
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
