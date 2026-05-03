import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/db';

/**
 * Cliente con service_role. BYPASSEA RLS.
 *
 * Úsalo SOLO para:
 *   - Webhook de Stripe (escribir tabla subscriptions)
 *   - Render público de sitios publicados (leer publications por slug)
 *   - Inserción en tablas write-only para usuarios (messages, agent_traces)
 *
 * El import 'server-only' fuerza un build error si por error se importa
 * desde un Client Component. Defensa en profundidad — security_auditor.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definida');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
