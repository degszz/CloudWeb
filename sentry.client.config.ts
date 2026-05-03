import * as Sentry from '@sentry/nextjs';

/**
 * Sentry client-side. Solo inicializa si el DSN está configurado.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Performance: sample 10% de transacciones en producción
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay: captura 1% normal, 100% en errores
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        // No capturar inputs (seguridad)
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true,
      }),
    ],

    // Filtrar errores de red genéricos que no son bugs nuestros
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'AbortError',
    ],
  });
}
