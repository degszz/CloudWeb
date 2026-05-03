import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/health
 *
 * Health check para monitoring (Vercel, UptimeRobot, etc).
 * Verifica que los servicios críticos están vivos.
 *
 * Respuesta: { status: 'ok' | 'degraded', checks: {...} }
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, boolean> = {};
  let allOk = true;

  // 1. Database
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks.database = !error;
  } catch {
    checks.database = false;
  }
  if (!checks.database) allOk = false;

  // 2. Anthropic API key configurada (no hacemos llamada real para no gastar)
  checks.anthropic_key = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!checks.anthropic_key) allOk = false;

  // 3. Stripe key configurada
  checks.stripe_key = Boolean(process.env.STRIPE_SECRET_KEY);

  // 4. MercadoPago key configurada
  checks.mercadopago_key = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
