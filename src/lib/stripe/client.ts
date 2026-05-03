import 'server-only';

import Stripe from 'stripe';

/**
 * Cliente Stripe lazy — se instancia en la primera llamada.
 *
 * Evita que el build falle cuando STRIPE_SECRET_KEY no está definida
 * (e.g. primer deploy sin Stripe configurado). El error se lanza al
 * invocar getStripe(), no al importar el módulo.
 */

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY no está definida');
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
    appInfo: {
      name: 'CloudWeb',
      version: '0.1.0',
    },
  });
  return _stripe;
}

/** @deprecated Usa getStripe() en su lugar. Mantenido para compat. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
