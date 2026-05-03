'use server';

import { redirect } from 'next/navigation';

import { detectCountry } from '@/lib/geo';
import { createPreapproval } from '@/lib/mercadopago/client';
import { stripe } from '@/lib/stripe/client';
import {
  PLANS,
  DEFAULT_PLAN,
  type PaymentProvider,
} from '@/lib/stripe/plans';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Server Actions del flujo de billing — dual provider.
 *
 * Lógica:
 *   1. Detectar país del usuario (headers CDN)
 *   2. Si Argentina → MercadoPago (preapproval en ARS)
 *   3. Si otro país → Stripe (Checkout Session en USD)
 *   4. El usuario puede forzar un provider con el param ?provider=
 *
 * Ambos flujos terminan redirigiendo al checkout del provider.
 * El webhook correspondiente sincroniza con nuestra tabla subscriptions.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function startCheckoutAction(formData: FormData) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/settings/billing');

  // Permitir override manual del provider (ej: argentino que quiere pagar en USD)
  const providerOverride = formData.get('provider') as PaymentProvider | null;
  const geo = await detectCountry();
  const provider = providerOverride ?? geo.provider;

  if (provider === 'mercadopago') {
    await startMercadoPagoCheckout(user.id, user.email ?? '');
  } else {
    await startStripeCheckout(user.id);
  }
}

// =========================================================================
// Stripe (internacional)
// =========================================================================
async function startStripeCheckout(userId: string): Promise<never> {
  const plan = PLANS[DEFAULT_PLAN];
  const pricing = plan.pricing.stripe;

  if (!pricing.priceId) {
    throw new Error('NEXT_PUBLIC_STRIPE_PRICE_ID no está configurado.');
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', userId)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;
    await admin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: pricing.priceId, quantity: 1 }],
    success_url: `${APP_URL}/dashboard?welcome=1`,
    cancel_url: `${APP_URL}/settings/billing`,
    subscription_data: { trial_period_days: plan.trialDays },
    allow_promotion_codes: true,
    metadata: { supabase_user_id: userId },
  });

  if (!session.url) throw new Error('Stripe no devolvió URL de checkout.');
  redirect(session.url);
}

// =========================================================================
// MercadoPago (Argentina)
// =========================================================================
async function startMercadoPagoCheckout(
  userId: string,
  email: string
): Promise<never> {
  const plan = PLANS[DEFAULT_PLAN];
  const pricing = plan.pricing.mercadopago;

  const preapproval = await createPreapproval({
    payerEmail: email,
    reason: `${plan.name} — suscripción mensual`,
    amount: pricing.amount,
    backUrl: `${APP_URL}/dashboard?welcome=1`,
    externalReference: userId,
  });

  redirect(preapproval.init_point);
}

// =========================================================================
// Portal (solo Stripe — MP no tiene portal equivalente)
// =========================================================================
export async function openPortalAction() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/settings/billing');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    redirect('/settings/billing?error=no_customer');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${APP_URL}/settings/billing`,
  });
  redirect(session.url);
}

// =========================================================================
// Cancelar suscripción MP (equivalente al portal de Stripe)
// =========================================================================
export async function cancelMercadoPagoAction() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: mpSub } = await admin
    .from('mercadopago_preapprovals')
    .select('id, mp_status')
    .eq('user_id', user.id)
    .in('mp_status', ['authorized', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!mpSub) {
    redirect('/settings/billing?error=no_subscription');
  }

  const { cancelPreapproval } = await import('@/lib/mercadopago/client');
  await cancelPreapproval(mpSub.id);

  redirect('/settings/billing?canceled=1');
}
