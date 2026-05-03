import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import {
  getPreapproval,
  mapMpStatusToSubscription,
} from '@/lib/mercadopago/client';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Webhook MercadoPago — IPN (Instant Payment Notification).
 *
 * MP envía un POST con { type, data: { id } } cuando cambia el estado
 * de un preapproval (suscripción). Nosotros:
 *   1. Verificamos que el type nos interesa ('subscription_preapproval')
 *   2. Fetching el preapproval completo desde la API de MP
 *   3. Extraemos el user_id del external_reference
 *   4. UPSERT en mercadopago_preapprovals + subscriptions
 *
 * Seguridad: verificamos que el preapproval existe en MP haciendo GET.
 * Si alguien envía un ID falso, el GET falla y no actualizamos nada.
 *
 * Idempotencia: UPSERT por preapproval_id → reintentos de MP no duplican.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: { type?: string; data?: { id?: string }; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // MP envía varios tipos de notificación. Solo nos interesan preapprovals.
  const topic = body.type ?? '';
  if (
    topic !== 'subscription_preapproval' &&
    topic !== 'subscription_authorized_payment'
  ) {
    // Aceptamos otros topics sin procesar (MP espera 200 OK)
    return NextResponse.json({ received: true, ignored: topic });
  }

  const resourceId = body.data?.id;
  if (!resourceId) {
    return NextResponse.json({ error: 'Missing data.id' }, { status: 400 });
  }

  try {
    if (topic === 'subscription_preapproval') {
      await syncPreapproval(resourceId);
    }
    // subscription_authorized_payment: confirmación de pago individual.
    // En MVP no lo procesamos (el estado de la suscripción ya se trackea
    // via el preapproval). Post-MVP: registrar cada pago para contabilidad.

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[mp webhook] error procesando ${topic}/${resourceId}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}

async function syncPreapproval(preapprovalId: string): Promise<void> {
  // 1. Fetch estado real desde MP (verificación + datos frescos)
  const preapproval = await getPreapproval(preapprovalId);
  const externalRef = preapproval.external_reference;

  // external_reference contiene el user_id que pusimos al crear
  if (!externalRef) {
    console.warn(`[mp webhook] preapproval ${preapprovalId} sin external_reference`);
    return;
  }

  const userId = externalRef;
  const admin = createAdminClient();

  // Verificar que el usuario existe
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    console.warn(`[mp webhook] user ${userId} no encontrado para preapproval ${preapprovalId}`);
    return;
  }

  const mpStatus = preapproval.status;
  const subStatus = mapMpStatusToSubscription(mpStatus);

  // 2. UPSERT en nuestra tabla subscriptions (modelo unificado)
  const subscriptionId = `mp_${preapprovalId}`;
  const amount = (preapproval as Record<string, unknown>).auto_recurring
    ? ((preapproval as Record<string, unknown>).auto_recurring as Record<string, unknown>)
        .transaction_amount
    : 0;

  const { error: subErr } = await admin.from('subscriptions').upsert(
    {
      id: subscriptionId,
      user_id: userId,
      status: subStatus,
      price_id: `mp_ars_${amount}`,
      quantity: 1,
      cancel_at_period_end: mpStatus === 'cancelled',
      current_period_start: preapproval.date_created
        ? new Date(preapproval.date_created).toISOString()
        : null,
      current_period_end: null, // MP no da esta info directamente
      trial_end: null,
      provider: 'mercadopago',
      currency: 'ars',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (subErr) {
    throw new Error(`upsert subscriptions: ${subErr.message}`);
  }

  // 3. UPSERT en mercadopago_preapprovals (detalle MP)
  const { error: mpErr } = await admin
    .from('mercadopago_preapprovals')
    .upsert(
      {
        id: preapprovalId,
        user_id: userId,
        mp_status: mpStatus,
        payer_email: preapproval.payer_email ?? null,
        amount: typeof amount === 'number' ? amount : 0,
        currency: 'ARS',
        date_created: preapproval.date_created
          ? new Date(preapproval.date_created).toISOString()
          : null,
        last_modified: preapproval.last_modified
          ? new Date(preapproval.last_modified).toISOString()
          : null,
        subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (mpErr) {
    throw new Error(`upsert mp_preapprovals: ${mpErr.message}`);
  }
}
