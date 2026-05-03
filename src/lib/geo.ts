import 'server-only';

import { headers } from 'next/headers';

import { providerForCountry, type PaymentProvider } from '@/lib/stripe/plans';

/**
 * Detección de país del usuario a partir de headers del CDN.
 *
 * Vercel inyecta `x-vercel-ip-country` automáticamente en Edge/Serverless.
 * Cloudflare inyecta `cf-ipcountry`. En local no hay ninguno → fallback.
 *
 * Se usa para:
 *   - Elegir entre Stripe y MercadoPago
 *   - Mostrar precios en USD o ARS
 *   - Ajustar copy de la landing (futuro)
 *
 * NO requiere consentimiento RGPD: no almacenamos IP, solo leemos un
 * header que ya está ahí. El resultado es un código de país de 2 letras.
 */

export interface GeoInfo {
  /** ISO 3166-1 alpha-2 country code, o null si no se pudo detectar. */
  countryCode: string | null;
  /** Provider recomendado según el país. */
  provider: PaymentProvider;
  /** true si estamos en Argentina. */
  isArgentina: boolean;
}

export async function detectCountry(): Promise<GeoInfo> {
  const h = await headers();

  // Vercel (production + preview)
  const vercelCountry = h.get('x-vercel-ip-country');
  if (vercelCountry) {
    return buildGeoInfo(vercelCountry);
  }

  // Cloudflare (si se usa delante de Vercel o como CDN propio)
  const cfCountry = h.get('cf-ipcountry');
  if (cfCountry && cfCountry !== 'XX') {
    return buildGeoInfo(cfCountry);
  }

  // Local / dev: no hay headers de CDN. Fallback configurable vía env.
  const devCountry = process.env.DEV_COUNTRY_OVERRIDE ?? null;
  return buildGeoInfo(devCountry);
}

function buildGeoInfo(countryCode: string | null): GeoInfo {
  const code = countryCode?.toUpperCase() ?? null;
  return {
    countryCode: code,
    provider: providerForCountry(code),
    isArgentina: code === 'AR',
  };
}
