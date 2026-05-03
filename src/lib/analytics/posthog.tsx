'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, type ReactNode } from 'react';

/**
 * Provider de Posthog.
 *
 * Se monta en el layout raíz. Solo inicializa si la key está configurada,
 * así que en dev local sin key simplemente no trackea.
 *
 * Configuración:
 *   - EU cloud (RGPD)
 *   - Session recordings activados
 *   - Autocapture de clicks y pageviews
 *   - Sin cookies de terceros (cookieless por defecto con EU cloud)
 */

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export function PosthogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: true,
      // Session recordings
      session_recording: {
        recordCrossOriginIframes: false,
      },
    });
  }, []);

  if (!POSTHOG_KEY) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

/**
 * Identifica al usuario tras login (para asociar eventos a su perfil).
 * Llamar desde un Client Component post-auth.
 */
export function identifyUser(userId: string, email?: string) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, { email });
}

/** Reset al cerrar sesión. */
export function resetPosthog() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}
