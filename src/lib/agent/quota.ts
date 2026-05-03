import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Gating de cuota mensual del agente.
 *
 * Decisión aprobada (50 primeros usuarios): SOFT-BLOCK.
 *
 *   - Cuando el usuario supera 200 turns en la ventana móvil de 30 días,
 *     no llamamos al modelo.
 *   - Devolvemos un mensaje estático explicándolo y ofreciendo contacto.
 *   - Notificamos al founder con user_id y uso para que decida caso por caso.
 *
 * Post-MVP (cientos de usuarios) → cambiar a hard-block con upgrade flow.
 *
 * Ventana móvil de 30 días: la función SQL `monthly_agent_turns()` cuenta
 * traces 'success' creados en los últimos 30 días. Esto evita el cliffhanger
 * del día 1 de cada mes y es más justo para usuarios que activan trial
 * a finales de mes.
 */

export const MONTHLY_QUOTA = 200;
const WARNING_THRESHOLD = 180;

export type QuotaStatus = 'ok' | 'warning' | 'exceeded';

export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  status: QuotaStatus;
}

/**
 * Mensaje estático devuelto al usuario cuando supera la cuota.
 * NO llama al modelo (no hay coste). Es la única respuesta del agente
 * cuando status = 'exceeded'.
 */
export const QUOTA_EXCEEDED_MESSAGE = `Has llegado al límite de turnos del mes. Tu sitio sigue publicado y puedes seguir editándolo manualmente desde el panel.

Si necesitas más turnos para terminar lo que estabas haciendo, escríbeme a hola@cloudweb.app y lo subo al instante.

— El equipo de CloudWeb`;

/** Lee el estado actual de cuota del usuario. */
export async function getQuotaState(userId: string): Promise<QuotaState> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc('agent_quota_status', { check_user_id: userId })
    .single();

  if (error || !data) {
    // Si la función falla, fallback conservador: permite continuar pero loguea.
    console.error('[quota] agent_quota_status falló:', error);
    return { used: 0, limit: MONTHLY_QUOTA, remaining: MONTHLY_QUOTA, status: 'ok' };
  }

  return {
    used: data.used,
    limit: data.monthly_limit,
    remaining: data.remaining,
    status: data.status as QuotaStatus,
  };
}

/**
 * Notifica al founder por email cuando un usuario supera la cuota.
 *
 * Idempotencia básica: solo notificamos UNA VEZ por usuario por ventana
 * de 30 días, comprobando si ya hay un trace 'quota_exceeded' reciente.
 * Esto evita inundar la bandeja del founder si el usuario sigue intentando.
 */
export async function notifyFounderOfQuotaExceeded(
  userId: string,
  state: QuotaState
): Promise<void> {
  const supabase = createAdminClient();

  // Evitar duplicados: si ya hay trace quota_exceeded en últimas 24h, salimos.
  const { data: recent } = await supabase
    .from('agent_traces')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'quota_exceeded')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle();

  if (recent) return; // ya notificado en últimas 24h

  // Cargar email del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  // Importación dinámica para no acoplar el resto del módulo a Resend
  // (que tiene side effects al importar)
  const founderEmail = process.env.FOUNDER_NOTIFY_EMAIL;
  if (!founderEmail) {
    console.warn('[quota] FOUNDER_NOTIFY_EMAIL no configurado, omitiendo notificación');
    return;
  }

  try {
    const { resend, FROM_EMAIL } = await import('@/lib/email/resend');
    await resend.emails.send({
      from: FROM_EMAIL,
      to: founderEmail,
      subject: `[CloudWeb] Usuario llegó al límite mensual: ${profile?.email ?? userId}`,
      text: [
        `Un usuario ha llegado al límite de ${state.limit} turnos en ventana móvil de 30 días.`,
        '',
        `User ID: ${userId}`,
        `Email:   ${profile?.email ?? '(no disponible)'}`,
        `Nombre:  ${profile?.full_name ?? '(no disponible)'}`,
        `Usados:  ${state.used} / ${state.limit}`,
        '',
        'El usuario ha visto el mensaje estático con tu email de contacto. Decide caso por caso si conviene subirle el límite.',
        '',
        'Para subir manualmente: corre en SQL editor el siguiente comando ajustando el nuevo límite:',
        '',
        '-- Crear un trace negativo que descuenta del cómputo es la opción más limpia post-MVP.',
        '-- En MVP: si quieres "regalarle" 100 turnos, lo más rápido es ajustar la función agent_quota_status temporalmente.',
      ].join('\n'),
    });
  } catch (err) {
    console.error('[quota] no se pudo notificar al founder:', err);
  }
}
