'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon } from '@/components/ui/icon';

interface PreviewPaneProps {
  /** URL del preview server-rendered (apunta a /builder/[siteId]/preview). */
  previewUrl: string;
  /** Tick que incrementa cuando hay state_changed → fuerza reload del iframe. */
  reloadKey: number;
  /** URL pública si el sitio está publicado (para "ver en vivo"). */
  publishedUrl: string | null;
}

/**
 * Preview en vivo del sitio del usuario.
 *
 * Diseño (minimalist_ui §5 — Faux-OS Window Chrome):
 *   - Contenedor minimalista con barra superior blanca
 *   - Tres círculos pequeños grises a la izquierda (controles macOS)
 *   - Centro: URL del sitio en mono
 *   - Derecha: botón "ver en vivo" si está publicado
 *
 * Recarga: cambiamos la `key` del iframe cuando reloadKey incrementa.
 * React desmonta y vuelve a montar el iframe, lo que dispara fetch
 * fresh del HTML y por tanto del JSON server-rendered.
 */
export function PreviewPane({ previewUrl, reloadKey, publishedUrl }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
  }, [reloadKey]);

  return (
    <div className="flex h-full flex-col bg-surface-bone p-4 md:p-6">
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-canvas-pure">
        {/* Window chrome */}
        <div className="flex shrink-0 items-center gap-3 border-b border-line bg-canvas-pure px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-pill bg-line" />
            <span className="h-3 w-3 rounded-pill bg-line" />
            <span className="h-3 w-3 rounded-pill bg-line" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="rounded-sm bg-surface-bone px-3 py-1 font-mono text-xs text-ink-mute">
              {extractDomain(previewUrl)}
            </span>
          </div>
          {publishedUrl && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink-strong"
            >
              Ver en vivo
              <Icon name="arrow-up-right" size={12} />
            </a>
          )}
        </div>

        {/* Iframe content */}
        <div className="relative flex-1 overflow-hidden">
          {isLoading && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px overflow-hidden bg-line">
              <div className="h-full w-1/3 animate-pulse bg-ink-strong" />
            </div>
          )}
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={previewUrl}
            title="Vista previa de tu sitio"
            className="h-full w-full border-0 bg-canvas"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.host + (u.pathname === '/' ? '' : u.pathname);
  } catch {
    return url;
  }
}
