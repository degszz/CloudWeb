import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { stripe } from '@/lib/stripe/client';
import { PLANS, DEFAULT_PLAN } from '@/lib/stripe/plans';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/stripe/checkout
 *
 * Endpoint alternativo a startCheckoutAction (Server Action).
 * Se mantiene por si en el futuro lo invocan integraciones externas
 * o un cliente fuera del propio Next.js.
 *
 * Devuelve { url } con la URL de la session.
 */
export const runtime = 'nodejs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(_request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const plan = PLANS[DEFAULT_PLAN];
  if (!plan.priceId) {
    return NextResponse.json(
      { error: 'Stripe Price ID no configurado' },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard?welcome=1`,
    cancel_url: `${APP_URL}/settings/billing`,
    subscription_data: { trial_period_days: plan.trialDays },
    allow_promotion_codes: true,
    metadata: { supabase_user_id: user.id },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe no devolvió URL' }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
