import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

import { calculateCostUsd } from '@/lib/agent/cost';
import {
  checkToolCall,
  checkUserInput,
  newTurnGuardState,
} from '@/lib/agent/guardrails';
import {
  appendMessage,
  findOrCreateConversation,
  loadHistory,
  recordTrace,
  touchConversation,
} from '@/lib/agent/persistence';
import {
  getQuotaState,
  notifyFounderOfQuotaExceeded,
  QUOTA_EXCEEDED_MESSAGE,
} from '@/lib/agent/quota';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_VERSION } from '@/lib/agent/system-prompt';
import { executeTool } from '@/lib/agent/tool-executors';
import { agentTools } from '@/lib/agent/tools';
import type {
  RunnerEvent,
  RunnerInput,
  ToolTraceItem,
  TurnTelemetry,
} from '@/lib/agent/types';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[agent] ANTHROPIC_API_KEY no está definida');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AGENT_MODEL =
  process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

export const MAX_AGENT_ITERATIONS = 8;

/**
 * Runner del agente. Implementado como AsyncGenerator para que el route
 * handler (que sirve SSE) pueda yield cada RunnerEvent al cliente sin
 * acoplarse al transport.
 *
 * Flujo por turn:
 *   1. Quota check (soft-block + notificación al founder si excedida)
 *   2. Input guardrails
 *   3. Buscar/crear conversación + persistir mensaje user
 *   4. Loop de tool use:
 *      a. Llamar al modelo con prompt caching activo en system
 *      b. Procesar content blocks
 *      c. Si stop_reason='tool_use': ejecutar tools, persistir, continuar
 *      d. Si stop_reason='end_turn': stream el text final, salir
 *   5. Persistir mensaje assistant final
 *   6. Registrar trace agregado
 *
 * Errores: cualquier excepción se captura, se yield como event 'error',
 * se registra trace con status apropiado y se devuelve sin romper SSE.
 */
export async function* runAgentTurn(
  input: RunnerInput
): AsyncGenerator<RunnerEvent, void, void> {
  const startTime = Date.now();
  const telemetry: TurnTelemetry = {
    iterations: 0,
    toolsCalled: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheCreationTokens: 0,
    totalLatencyMs: 0,
    totalCostUsd: 0,
  };

  // ----- Quota -----
  const quota = await getQuotaState(input.userId);
  if (quota.status === 'exceeded') {
    // Soft-block: ni siquiera llamamos al modelo. Devolvemos mensaje estático.
    const conversationId = await findOrCreateConversation(
      input.siteId,
      input.userId,
      input.conversationId,
      input.userMessage
    );
    await appendMessage(conversationId, {
      role: 'user',
      content: [{ type: 'text', text: input.userMessage }],
    });
    await appendMessage(conversationId, {
      role: 'assistant',
      content: [{ type: 'text', text: QUOTA_EXCEEDED_MESSAGE }],
      stopReason: 'quota_exceeded',
      promptVersion: SYSTEM_PROMPT_VERSION,
    });
    await touchConversation(conversationId);

    // Notificar al founder (best-effort, no bloqueante para el usuario)
    notifyFounderOfQuotaExceeded(input.userId, quota).catch((err) =>
      console.error('[runner] notifyFounder falló:', err)
    );

    await recordTrace({
      conversationId,
      userId: input.userId,
      siteId: input.siteId,
      telemetry,
      status: 'quota_exceeded',
    });

    // Stream del mensaje estático token-a-token (UX consistente)
    yield { type: 'text_delta', delta: QUOTA_EXCEEDED_MESSAGE };
    yield { type: 'done', conversationId, finalText: QUOTA_EXCEEDED_MESSAGE };
    return;
  }

  // ----- Input guardrails -----
  const inputCheck = checkUserInput(input.userMessage);
  if (!inputCheck.allow) {
    yield { type: 'error', message: inputCheck.reason ?? 'Mensaje no válido', code: 'guardrail_input' };
    await recordTrace({
      conversationId: input.conversationId,
      userId: input.userId,
      siteId: input.siteId,
      telemetry,
      status: 'guardrail_input_block',
      errorDetail: inputCheck.reason,
    });
    return;
  }
  if (inputCheck.flagged) {
    console.warn(`[runner] input flagged for user ${input.userId}: posible injection`);
  }

  // ----- Conversación + persistir mensaje user -----
  let conversationId: string;
  try {
    conversationId = await findOrCreateConversation(
      input.siteId,
      input.userId,
      input.conversationId,
      input.userMessage
    );
  } catch (err) {
    yield { type: 'error', message: 'No se pudo crear la conversación.', code: 'persist' };
    return;
  }

  await appendMessage(conversationId, {
    role: 'user',
    content: [{ type: 'text', text: input.userMessage }],
  });

  // Estado del agente para esta llamada
  const guardState = newTurnGuardState();
  const history = await loadHistory(conversationId);
  // Reemplazamos el último mensaje (el que acabamos de persistir) por el user real;
  // loadHistory ya lo trae, así que history está completo.
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content as Anthropic.MessageParam['content'],
  }));

  // System con prompt caching activado
  const system: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ];

  let finalText = '';
  let mutatedStateAtLeastOnce = false;

  // ----- Loop de tool use -----
  try {
    for (let iter = 0; iter < MAX_AGENT_ITERATIONS; iter++) {
      telemetry.iterations += 1;

      // Status para que la UI pueda mostrar "Trabajando en tu web..." si hay tools
      if (iter === 0) {
        yield { type: 'status', message: 'Pensando…' };
      }

      const callStart = Date.now();
      const response = await anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 2048,
        system,
        tools: agentTools,
        messages,
      });
      const callMs = Date.now() - callStart;

      // Acumular telemetría
      telemetry.totalInputTokens += response.usage.input_tokens;
      telemetry.totalOutputTokens += response.usage.output_tokens;
      telemetry.totalCacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
      telemetry.totalCacheCreationTokens += response.usage.cache_creation_input_tokens ?? 0;
      telemetry.totalLatencyMs += callMs;
      telemetry.totalCostUsd += calculateCostUsd(AGENT_MODEL, {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
        cacheCreationTokens: response.usage.cache_creation_input_tokens ?? undefined,
      });

      // ----- end_turn: stream del texto final y salir -----
      if (response.stop_reason === 'end_turn') {
        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === 'text'
        );
        finalText = textBlocks.map((b) => b.text).join('\n').trim();

        // Persistir mensaje assistant antes de stream (idempotencia ante desconexión)
        await appendMessage(conversationId, {
          role: 'assistant',
          content: response.content,
          model: AGENT_MODEL,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
          cacheCreationTokens: response.usage.cache_creation_input_tokens ?? undefined,
          costUsd: calculateCostUsd(AGENT_MODEL, {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
            cacheCreationTokens: response.usage.cache_creation_input_tokens ?? undefined,
          }),
          latencyMs: callMs,
          stopReason: 'end_turn',
          promptVersion: SYSTEM_PROMPT_VERSION,
        });

        // Stream del texto final en chunks de palabra (decisión #3:
        // streaming solo del texto final, no de tool_uses intermedios).
        // No usamos streaming real del SDK porque queremos persistir
        // primero, evitar duplicados al desconectar, y mantener el
        // generator simple. Chunks de ~3 palabras dan sensación natural.
        for (const chunk of chunkText(finalText)) {
          yield { type: 'text_delta', delta: chunk };
        }

        if (mutatedStateAtLeastOnce) {
          yield { type: 'state_changed' };
        }

        await touchConversation(conversationId);
        await recordTrace({
          conversationId,
          userId: input.userId,
          siteId: input.siteId,
          telemetry,
          status: 'success',
        });

        yield { type: 'done', conversationId, finalText };
        return;
      }

      // ----- tool_use: ejecutar tools y continuar -----
      if (response.stop_reason === 'tool_use') {
        const toolUses = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
        );

        // Persistir el mensaje assistant con sus tool_uses
        await appendMessage(conversationId, {
          role: 'assistant',
          content: response.content,
          model: AGENT_MODEL,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
          cacheCreationTokens: response.usage.cache_creation_input_tokens ?? undefined,
          costUsd: calculateCostUsd(AGENT_MODEL, {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
            cacheCreationTokens: response.usage.cache_creation_input_tokens ?? undefined,
          }),
          latencyMs: callMs,
          stopReason: 'tool_use',
          promptVersion: SYSTEM_PROMPT_VERSION,
        });

        // Indicar al usuario que estamos trabajando (sin detalles técnicos)
        yield { type: 'status', message: 'Trabajando en tu web…' };

        // Ejecutar tools secuencialmente (preservando idempotencia/orden de writes)
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tu of toolUses) {
          const toolStart = Date.now();
          const guardCheck = checkToolCall(tu.name, tu.input, guardState);

          let resultPayload: unknown;
          let success: boolean;
          let errorMsg: string | undefined;

          if (!guardCheck.allow) {
            success = false;
            errorMsg = guardCheck.reason;
            resultPayload = { error: guardCheck.reason };
          } else {
            const exec = await executeTool(
              { siteId: input.siteId, userId: input.userId },
              tu.name,
              tu.input
            );
            success = exec.success;
            errorMsg = exec.error;
            resultPayload = exec.success ? exec.result : { error: exec.error };
            if (exec.mutatedState) mutatedStateAtLeastOnce = true;
          }

          const toolMs = Date.now() - toolStart;
          const traceItem: ToolTraceItem = {
            name: tu.name,
            input: tu.input,
            success,
            error: errorMsg,
            latencyMs: toolMs,
          };
          telemetry.toolsCalled.push(traceItem);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: JSON.stringify(resultPayload),
            is_error: !success,
          });
        }

        // Persistir el mensaje 'tool' (user con tool_result blocks)
        await appendMessage(conversationId, {
          role: 'tool',
          content: toolResults,
        });

        // Añadir al historial in-memory para la siguiente iteración
        messages.push({ role: 'assistant', content: response.content });
        messages.push({ role: 'user', content: toolResults });

        continue;
      }

      // ----- Otros stop_reasons (max_tokens, stop_sequence) -----
      // Tratamos como respuesta final con el texto que haya
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === 'text'
      );
      finalText = textBlocks.map((b) => b.text).join('\n').trim() ||
        'Lo siento, no he podido completar tu petición. ¿Puedes reformularla?';

      await appendMessage(conversationId, {
        role: 'assistant',
        content: response.content,
        model: AGENT_MODEL,
        stopReason: response.stop_reason ?? 'unknown',
        promptVersion: SYSTEM_PROMPT_VERSION,
      });

      for (const chunk of chunkText(finalText)) {
        yield { type: 'text_delta', delta: chunk };
      }
      if (mutatedStateAtLeastOnce) yield { type: 'state_changed' };

      await touchConversation(conversationId);
      await recordTrace({
        conversationId,
        userId: input.userId,
        siteId: input.siteId,
        telemetry,
        status: 'success',
      });
      yield { type: 'done', conversationId, finalText };
      return;
    }

    // ----- Max iterations sin end_turn -----
    const fallback =
      'Necesito un momento para pensarlo mejor. ¿Puedes decirme con más concreción qué quieres cambiar?';
    yield { type: 'text_delta', delta: fallback };
    yield { type: 'state_changed' }; // por si hubo cambios parciales
    await recordTrace({
      conversationId,
      userId: input.userId,
      siteId: input.siteId,
      telemetry,
      status: 'max_iterations',
      errorDetail: `Alcanzadas ${MAX_AGENT_ITERATIONS} iteraciones sin end_turn`,
    });
    yield { type: 'done', conversationId, finalText: fallback };
  } catch (err) {
    console.error('[runner] error inesperado:', err);
    const errorMessage =
      'Algo no fue bien por mi lado. Si vuelve a pasar, escríbeme a hola@nuweb.app.';
    yield { type: 'error', message: errorMessage, code: 'runner_exception' };

    await recordTrace({
      conversationId,
      userId: input.userId,
      siteId: input.siteId,
      telemetry,
      status: 'model_error',
      errorDetail: (err as Error).message ?? 'unknown',
    });
  }
}

/**
 * Trocea texto en chunks de ~3 palabras para simular streaming.
 * Tamaño elegido para que el efecto sea visible sin saturar SSE
 * con eventos de 1-2 caracteres.
 */
function* chunkText(text: string): Generator<string> {
  const tokens = text.match(/\S+\s*/g) ?? [text];
  const chunkSize = 3;
  for (let i = 0; i < tokens.length; i += chunkSize) {
    yield tokens.slice(i, i + chunkSize).join('');
  }
}

export function getAgentMetadata() {
  return {
    model: AGENT_MODEL,
    promptVersion: SYSTEM_PROMPT_VERSION,
    toolCount: agentTools.length,
    maxIterations: MAX_AGENT_ITERATIONS,
  };
}
