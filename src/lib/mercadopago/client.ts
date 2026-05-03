import 'server-only';

/**
 * Cliente MercadoPago.
 *
 * Usa la REST API directamente en vez del SDK de MP porque:
 *   1. El SDK es pesado y tiene dependencias innecesarias
 *   2. Solo necesitamos 3 endpoints: preapproval, webhook verify, customer
 *   3. REST directo = más control sobre errores y retry
 *
 * Docs: https://www.mercadopago.com.ar/developers/es/reference
 *
 * Flujo de suscripción:
 *   1. Crear "preapproval" (= checkout de suscripción recurrente)
 *   2. MP redirige al usuario a su página de pago
 *   3. El usuario paga con tarjeta/débito/transferencia
 *   4. MP envía webhook (IPN) con el estado del preapproval
 *   5. Nuestro webhook sincroniza con subscriptions
 */

const MP_API_BASE = 'https://api.mercadopago.com';

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
  }
  return token;
}

async function mpFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${MP_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `MercadoPago API error ${response.status}: ${body.slice(0, 500)}`
    );
  }

  return response.json() as Promise<T>;
}

// =========================================================================
// Preapproval (suscripción recurrente)
// =========================================================================

export interface CreatePreapprovalInput {
  /** Email del pagador. */
  payerEmail: string;
  /** Título visible al usuario en el checkout de MP. */
  reason: string;
  /** Monto mensual en ARS (entero, sin decimales para suscripciones). */
  amount: number;
  /** URL a la que redirigir tras completar el pago. */
  backUrl: string;
  /** Metadata custom (user_id, plan_id, etc). */
  externalReference: string;
}

export interface PreapprovalResponse {
  id: string;
  status: string;
  init_point: string; // URL del checkout de MP
  payer_email: string;
  date_created: string;
  last_modified: string;
  external_reference: string;
  [key: string]: unknown;
}

/**
 * Crea un preapproval (suscripción recurrente) en MercadoPago.
 *
 * El usuario es redirigido a `init_point` para completar el pago.
 * Tras pagar, MP envía webhook a /api/mercadopago/webhook.
 *
 * auto_recurring define: frecuencia mensual, monto en ARS, sin fecha
 * de fin (cancelable por el usuario o el founder en cualquier momento).
 */
export async function createPreapproval(
  input: CreatePreapprovalInput
): Promise<PreapprovalResponse> {
  return mpFetch<PreapprovalResponse>('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      payer_email: input.payerEmail,
      reason: input.reason,
      external_reference: input.externalReference,
      back_url: input.backUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: input.amount,
        currency_id: 'ARS',
      },
      status: 'pending',
    }),
  });
}

// =========================================================================
// Consultar estado de un preapproval
// =========================================================================

export async function getPreapproval(
  preapprovalId: string
): Promise<PreapprovalResponse> {
  return mpFetch<PreapprovalResponse>(`/preapproval/${preapprovalId}`);
}

// =========================================================================
// Cancelar un preapproval
// =========================================================================

export async function cancelPreapproval(
  preapprovalId: string
): Promise<PreapprovalResponse> {
  return mpFetch<PreapprovalResponse>(`/preapproval/${preapprovalId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

// =========================================================================
// Mapeo de estados MP → nuestro enum subscription_status
// =========================================================================

type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'past_due'
  | 'paused';

/**
 * Mapea el status de MercadoPago al enum subscription_status de nuestra DB.
 *
 * Estados de MP para preapprovals:
 *   - pending: esperando primer pago
 *   - authorized: activo, cobros al día
 *   - paused: pausado por el usuario o por falta de pago
 *   - cancelled: cancelado
 */
export function mapMpStatusToSubscription(mpStatus: string): SubscriptionStatus {
  switch (mpStatus) {
    case 'authorized':
      return 'active';
    case 'pending':
      return 'incomplete';
    case 'paused':
      return 'paused';
    case 'cancelled':
      return 'canceled';
    default:
      return 'incomplete';
  }
}
