import 'server-only';

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY no está definida');
}

/**
 * Cliente Stripe único. La versión de API se fija explícitamente
 * para que un cambio en la SDK no rompa el webhook silenciosamente.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
  typescript: true,
  appInfo: {
    name: 'CloudWeb',
    version: '0.1.0',
  },
});
