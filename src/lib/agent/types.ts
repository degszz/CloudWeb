import type Anthropic from '@anthropic-ai/sdk';

/**
 * Tipos compartidos entre runner, executors, route handler y persistence.
 */

export interface RunnerInput {
  siteId: string;
  userId: string;
  /** Texto del usuario en este turn. */
  userMessage: string;
  /** Conversación existente o null para crear una nueva. */
  conversationId: string | null;
}

/** Eventos que el runner emite (consumidos por el route handler como SSE). */
export type RunnerEvent =
  | { type: 'status'; message: string }
  | { type: 'text_delta'; delta: string }
  | { type: 'state_changed' /** El JSON del site cambió: front debe re-fetch */ }
  | {
      type: 'done';
      conversationId: string;
      /** Texto completo de la respuesta del agente (para acumular si se perdió un delta). */
      finalText: string;
    }
  | { type: 'error'; message: string; code: string };

/** Resultado de ejecutar una tool del agente. */
export interface ToolExecutionResult {
  success: boolean;
  /** Contenido que se devuelve al modelo como tool_result. JSON-serializable. */
  result: unknown;
  /** Mensaje de error legible si success=false. El modelo lo lee y reintenta. */
  error?: string;
  /** Si la ejecución modificó el JSON del site, true para que el runner emita 'state_changed'. */
  mutatedState?: boolean;
}

/** Item de telemetría de una tool call para guardar en agent_traces.tools_called. */
export interface ToolTraceItem {
  name: string;
  input: unknown;
  success: boolean;
  error?: string;
  latencyMs: number;
}

/** Acumulador de telemetría durante un turn. */
export interface TurnTelemetry {
  iterations: number;
  toolsCalled: ToolTraceItem[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
  totalLatencyMs: number;
  totalCostUsd: number;
}

/** Tipo helper para los content blocks de Anthropic en messages. */
export type AnthropicContent = Anthropic.ContentBlock[];

/** Mensaje persistido en DB: estructura mínima común. */
export interface PersistedMessage {
  role: 'user' | 'assistant' | 'tool';
  content: unknown;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  costUsd?: number;
  latencyMs?: number;
  stopReason?: string;
  promptVersion?: string;
}
