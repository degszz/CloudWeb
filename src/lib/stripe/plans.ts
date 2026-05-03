/**
 * Planes de CloudWeb — pricing dual USD/ARS.
 *
 * Un solo plan con dos precios según el país del usuario:
 *   - Internacional: $29 USD/mes via Stripe
 *   - Argentina: $14.999 ARS/mes via MercadoPago (cobra directo en pesos)
 *
 * El precio en ARS es accesible para el mercado local. Ajustable con
 * datos reales de conversión post-MVP.
 *
 * Los IDs de precio de cada provider se inyectan vía env para no acoplar
 * el código a dashboards externos.
 */

export type PlanId = 'cloudweb-pro';
export type PaymentProvider = 'stripe' | 'mercadopago';
export type Currency = 'usd' | 'ars';

export interface PlanPricing {
  provider: PaymentProvider;
  currency: Currency;
  /** Monto mensual en la moneda correspondiente. */
  amount: number;
  /** Monto formateado para mostrar al usuario. */
  display: string;
  /** ID del precio en el dashboard del provider. */
  priceId: string | undefined;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  trialDays: number;
  pricing: Record<PaymentProvider, PlanPricing>;
  features: ReadonlyArray<string>;
}

export const PLANS: Record<PlanId, Plan> = {
  'cloudweb-pro': {
    id: 'cloudweb-pro',
    name: 'CloudWeb Pro',
    description:
      'Una web profesional creada en conversación con un agente de IA. Publicación incluida.',
    trialDays: 14,
    pricing: {
      stripe: {
        provider: 'stripe',
        currency: 'usd',
        amount: 29,
        display: 'US$29',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
      },
      mercadopago: {
        provider: 'mercadopago',
        currency: 'ars',
        amount: 14999,
        display: '$14.999',
        priceId: process.env.NEXT_PUBLIC_MP_PLAN_ID,
      },
    },
    features: ['site:create', 'site:publish', 'agent:chat'] as const,
  },
} as const;

export const DEFAULT_PLAN: PlanId = 'cloudweb-pro';

/** Devuelve el pricing correcto según el provider del usuario. */
export function getPricing(
  planId: PlanId,
  provider: PaymentProvider
): PlanPricing {
  return PLANS[planId].pricing[provider];
}

/** Detecta qué provider usar según el país. */
export function providerForCountry(countryCode: string | null): PaymentProvider {
  if (countryCode?.toUpperCase() === 'AR') return 'mercadopago';
  return 'stripe';
}
