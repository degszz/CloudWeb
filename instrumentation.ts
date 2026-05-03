/**
 * Next.js instrumentation hook.
 * Se ejecuta una vez al arrancar el server.
 * Carga la config de Sentry para el server runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
}
