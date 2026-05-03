import 'server-only';

import { headers } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Webhook Stripe — la FUENTE DE VERDAD de subscriptions.
 *
 * saas_backend.md: "nunca confíes en el front para saber si un usuario
 * ha pagado: consulta la tabla subscriptions". Este handler es lo que
 * mantiene esa tabla al día.
 *
 * Eventos manejados:
 *   - checkout.session.completed → asegura que el customer tiene el
 *     supabase_user_id en metadata
 *   - customer.subscription.created/updated/deleted → upsert de la fila
 *   - invoice.payment_failed → log + notificación (post-MVP)
 *
 * Idempotencia: usamos UPSERT por id de Stripe subscription. Reintentos
 * de Stripe no duplican filas.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const sig = (await headers()).get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET no configurado');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripe webhook] firma inválida:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await ensureCustomerLinked(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(
          `[stripe webhook] payment_failed customer=${invoice.customer} invoice=${invoice.id}`
        );
        // Post-MVP: enviar email al usuario notificando del fallo
        break;
      }
      default:
        // Ignoramos eventos que no nos interesan
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] handler ${event.type} falló:`, err);
    // Devolver 500 hace que Stripe reintente. OK para errores transitorios.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Asegura que el profile.stripe_customer_id está enlazado tras checkout. */
async function ensureCustomerLinked(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.supabase_user_id;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!userId || !customerId) return;

  const admin = createAdminClient();
  await admin
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId);
}

/** UPSERT de la fila de subscriptions en Supabase. */
async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const admin = createAdminClient();

  // Encontrar el user_id por stripe_customer_id
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!profile) {
    console.warn(
      `[stripe webhook] subscription ${subscription.id} de customer ${customerId} sin profile asociado`
    );
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? '';
  const quantity = subscription.items.data[0]?.quantity ?? 1;

  const { error } = await admin.from('subscriptions').upsert(
    {
      id: subscription.id,
      user_id: profile.id,
      status: subscription.status,
      price_id: priceId,
      quantity,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: toIso(subscription.current_period_start),
      current_period_end: toIso(subscription.current_period_end),
      trial_end: toIso(subscription.trial_end),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(`upsert subscriptions: ${error.message}`);
  }
}

function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}
