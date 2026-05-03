import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { runAgentTurn } from '@/lib/agent/runner';
import type { RunnerEvent } from '@/lib/agent/types';
import { agentChatLimiter } from '@/lib/ratelimit';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/agent/chat
 *
 * Body: { siteId, message, conversationId? }
 *
 * Devuelve un stream SSE con eventos del agente.
 * Tipos de evento (data: { type, ... }):
 *   - status:        progreso visible al usuario
 *   - text_delta:    chunk de texto del mensaje final
 *   - state_changed: el JSON del site cambió → cliente re-fetch preview
 *   - done:          fin del turn
 *   - error:         error recuperable
 *
 * Capas de defensa antes de invocar al runner:
 *   1. Auth: usuario debe estar logueado
 *   2. Ownership: el siteId debe pertenecer al usuario
 *   3. Rate limit Upstash: 30 turns/hora
 *   4. (dentro del runner) Quota mensual + input guardrails
 */

// Forzamos Node.js runtime (no Edge): el SDK de Anthropic + Supabase admin
// + algunas operaciones requieren APIs de Node.
export const runtime = 'nodejs';

// Sin caché en respuestas streaming
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  siteId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  // ----- 1. Auth -----
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // ----- 2. Body -----
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body no es JSON válido' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Body inválido' },
      { status: 400 }
    );
  }
  const { siteId, message, conversationId } = parsed.data;

  // ----- 3. Ownership -----
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!site) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 });
  }

  // ----- 4. Rate limit -----
  const limit = await agentChatLimiter.limit(user.id);
  if (!limit.success) {
    return NextResponse.json(
      {
        error: 'Has hecho demasiadas peticiones en poco tiempo. Espera un momento e inténtalo de nuevo.',
      },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1000)) } }
    );
  }

  // ----- 5. Stream SSE desde el runner -----
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: RunnerEvent) => {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        for await (const event of runAgentTurn({
          siteId,
          userId: user.id,
          userMessage: message,
          conversationId: conversationId ?? null,
        })) {
          send(event);
        }
      } catch (err) {
        console.error('[chat route] error en runner:', err);
        send({
          type: 'error',
          message: 'Algo no fue bien por mi lado. Inténtalo de nuevo.',
          code: 'route_exception',
        });
      } finally {
        controller.close();
      }
    },
    cancel() {
      // El cliente cerró la conexión. El runner ya persistió todo lo que
      // alcanzó a procesar antes de yield. No hay que hacer cleanup extra.
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // desactiva buffering de proxies
    },
  });
}
