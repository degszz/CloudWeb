import type { RunnerEvent } from '@/lib/agent/types';

/**
 * Cliente SSE para /api/agent/chat.
 *
 * Decisiones de diseño:
 *   - El endpoint usa POST (no GET), por lo que `EventSource` nativo no
 *     sirve. Usamos fetch + ReadableStream + TextDecoder.
 *   - Devolvemos un AbortController para que la UI pueda cancelar.
 *   - Los eventos vienen como `data: {...}\n\n`. Parseamos por bloques.
 */

export interface AgentChatRequest {
  siteId: string;
  message: string;
  conversationId?: string | null;
}

export type AgentEventHandler = (event: RunnerEvent) => void;

export interface AgentChatHandle {
  /** Promesa que resuelve cuando el stream termina. */
  done: Promise<void>;
  /** Cancela el turn en curso. */
  abort: () => void;
}

export function startAgentChat(
  body: AgentChatRequest,
  onEvent: AgentEventHandler
): AgentChatHandle {
  const controller = new AbortController();

  const done = (async () => {
    let response: Response;
    try {
      response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      onEvent({
        type: 'error',
        message: 'No se pudo conectar con el servidor.',
        code: 'fetch_error',
      });
      return;
    }

    if (!response.ok) {
      let errMsg = 'Error del servidor.';
      try {
        const data = await response.json();
        errMsg = data.error ?? errMsg;
      } catch {
        // sin JSON → mensaje genérico
      }
      onEvent({ type: 'error', message: errMsg, code: `http_${response.status}` });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onEvent({ type: 'error', message: 'Stream no disponible.', code: 'no_stream' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        // Procesa eventos completos (separados por "\n\n")
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);

          // Cada block puede tener varias líneas; nos interesan las que
          // empiezan por "data: ".
          for (const line of block.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (!json) continue;
            try {
              const event = JSON.parse(json) as RunnerEvent;
              onEvent(event);
            } catch {
              // ignoramos JSON inválido en stream
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        onEvent({
          type: 'error',
          message: 'Conexión interrumpida.',
          code: 'stream_error',
        });
      }
    }
  })();

  return {
    done,
    abort: () => controller.abort(),
  };
}
