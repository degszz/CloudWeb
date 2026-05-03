import 'server-only';

import { createServerClient } from '@/lib/supabase/server';

/**
 * Verifica si el usuario tiene acceso al producto.
 *
 * En MVP, el acceso se otorga si:
 *   1. Tiene una suscripción 'active' o 'trialing' (Stripe o MercadoPago)
 *   2. O el sitio fue creado hace menos de 24h (grace period para que
 *      el usuario pueda probar antes de que le pida pagar)
 *
 * Este grace period de 24h es intencional: el usuario crea su cuenta,
 * empieza a hablar con Lúa, ve el valor, y DESPUÉS le pedimos que
 * active el trial. Reducir fricción al máximo para los primeros 50.
 *
 * Post-MVP: el trial de 14 días de Stripe/MP reemplaza el grace period.
 * Pero para los primeros usuarios que llegan por boca a boca, queremos
 * que la experiencia sea "entras y ya estás construyendo".
 */

export type AccessStatus =
  | { allowed: true; reason: 'subscription' | 'grace_period' }
  | { allowed: false; reason: 'no_subscription'; gracePeriodExpired: boolean };

const GRACE_PERIOD_HOURS = 24;

export async function checkProductAccess(userId: string): Promise<AccessStatus> {
  const supabase = await createServerClient();

  // 1. Verificar suscripción activa
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .limit(1)
    .maybeSingle();

  if (sub) {
    return { allowed: true, reason: 'subscription' };
  }

  // 2. Grace period: ¿el sitio fue creado hace menos de 24h?
  const { data: site } = await supabase
    .from('sites')
    .select('created_at')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (site) {
    const createdAt = new Date(site.created_at);
    const hoursSinceCreation =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation < GRACE_PERIOD_HOURS) {
      return { allowed: true, reason: 'grace_period' };
    }

    return { allowed: false, reason: 'no_subscription', gracePeriodExpired: true };
  }

  // Sin sitio aún: permitir (van a crear uno)
  return { allowed: true, reason: 'grace_period' };
}
