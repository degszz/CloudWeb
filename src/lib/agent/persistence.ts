import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

import type {
  PersistedMessage,
  TurnTelemetry,
} from '@/lib/agent/types';

/**
 * Persistencia del agente. Todo va con service_role porque las tablas
 * messages / agent_traces son write-only para roles autenticados (los
 * mensajes los crea el runner tras pasar guardrails, no el cliente).
 *
 * Ver supabase/migrations/0004_conversations.sql y 0005_traces.sql.
 */

// =========================================================================
// Conversaciones
// =========================================================================

/**
 * Devuelve la conversación activa o crea una nueva.
 *
 * En MVP usamos UNA conversación por sitio: cada sitio tiene un único
 * hilo continuo con el agente. Si el usuario quiere "empezar de cero"
 * desde la UI, creamos otra conversación explícitamente.
 */
export async function findOrCreateConversation(
  siteId: string,
  userId: string,
  conversationId: string | null,
  firstUserMessage: string
): Promise<string> {
  const supabase = createAdminClient();

  if (conversationId) {
    // Verifica que existe y pertenece a este user (defense in depth)
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .maybeSingle();
    if (data) return data.id;
  }

  // Buscar la última conversación de este site
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Crear nueva
  const title = firstUserMessage.slice(0, 80).trim() || null;
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ site_id: siteId, user_id: userId, title })
    .select('id')
    .single();

  if (error) throw new Error(`No se pudo crear conversación: ${error.message}`);
  return created.id;
}

/** Actualiza el `updated_at` de la conversación tras un turn. */
export async function touchConversation(conversationId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
}

// =========================================================================
// Mensajes
// =========================================================================

/**
 * Carga el historial de mensajes de una conversación, en orden cronológico,
 * en formato Anthropic listo para inyectar en messages.create().
 *
 * Nota: filtramos los mensajes con role='tool' porque en formato Anthropic
 * los tool_results van como un mensaje user con content tool_result. Aquí
 * los persistimos con role='tool' para distinguirlos en consultas, pero al
 * reconstruir history los devolvemos como user (que es lo que espera el SDK).
 */
export async function loadHistory(
  conversationId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: unknown }>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`No se pudo cargar historial: ${error.message}`);

  return (data ?? []).map((row) => ({
    role: row.role === 'tool' ? ('user' as const) : (row.role as 'user' | 'assistant'),
    content: row.content,
  }));
}

/** Inserta un mensaje. Idempotencia: la PK es uuid generado en server. */
export async function appendMessage(
  conversationId: string,
  message: PersistedMessage
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    model: message.model ?? null,
    input_tokens: message.inputTokens ?? null,
    output_tokens: message.outputTokens ?? null,
    cache_read_tokens: message.cacheReadTokens ?? null,
    cache_creation_tokens: message.cacheCreationTokens ?? null,
    cost_usd: message.costUsd ?? null,
    latency_ms: message.latencyMs ?? null,
    stop_reason: message.stopReason ?? null,
    prompt_version: message.promptVersion ?? null,
  });
  if (error) throw new Error(`No se pudo persistir mensaje: ${error.message}`);
}

// =========================================================================
// Traces
// =========================================================================

interface RecordTraceInput {
  conversationId: string | null;
  userId: string;
  siteId: string | null;
  trigger?: string;
  telemetry: TurnTelemetry;
  status:
    | 'success'
    | 'max_iterations'
    | 'tool_error'
    | 'guardrail_input_block'
    | 'guardrail_output_block'
    | 'rate_limited'
    | 'quota_exceeded'
    | 'model_error';
  errorDetail?: string;
}

/** Registra el trace agregado del turn. Llamado al final del runner. */
export async function recordTrace(input: RecordTraceInput): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('agent_traces')
    .insert({
      conversation_id: input.conversationId,
      user_id: input.userId,
      site_id: input.siteId,
      trigger: input.trigger ?? 'user_message',
      iterations: input.telemetry.iterations,
      tools_called: input.telemetry.toolsCalled,
      total_input_tokens: input.telemetry.totalInputTokens,
      total_output_tokens: input.telemetry.totalOutputTokens,
      total_cache_read_tokens: input.telemetry.totalCacheReadTokens,
      total_cache_creation_tokens: input.telemetry.totalCacheCreationTokens,
      total_cost_usd: input.telemetry.totalCostUsd,
      total_latency_ms: input.telemetry.totalLatencyMs,
      status: input.status,
      error_detail: input.errorDetail ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`No se pudo registrar trace: ${error.message}`);
  return data.id;
}

// =========================================================================
// Sites: leer y escribir content_json (usado por executors)
// =========================================================================

export async function readSiteContent(siteId: string, userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sites')
    .select('id, slug, name, description, content_json, content_version, is_published')
    .eq('id', siteId)
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(`No se pudo leer site: ${error.message}`);
  return data;
}

export async function writeSiteContent(
  siteId: string,
  userId: string,
  contentJson: unknown,
  newVersion: number
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('sites')
    .update({
      content_json: contentJson,
      content_version: newVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', siteId)
    .eq('user_id', userId);
  if (error) throw new Error(`No se pudo guardar site: ${error.message}`);
}

export async function updateSiteMetadata(
  siteId: string,
  userId: string,
  patch: { name?: string; description?: string; slug?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  // Si cambia el slug, validar unicidad
  if (patch.slug) {
    const { data: clash } = await supabase
      .from('sites')
      .select('id')
      .eq('slug', patch.slug)
      .neq('id', siteId)
      .maybeSingle();
    if (clash) {
      return { ok: false, error: `El subdominio "${patch.slug}" ya está en uso. Prueba otro.` };
    }
  }
  const { error } = await supabase
    .from('sites')
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.slug !== undefined && { slug: patch.slug }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', siteId)
    .eq('user_id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
