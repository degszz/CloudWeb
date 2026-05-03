'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { Icon } from '@/components/ui/icon';
import { startAgentChat, type AgentChatHandle } from '@/lib/agent/client';
import { cn } from '@/lib/utils';

/**
 * Panel de chat del builder.
 *
 * Estado interno:
 *   - messages: lista de mensajes visibles (user + assistant)
 *   - status: estado del turn en curso ('idle' | 'thinking' | 'working' | 'streaming')
 *   - input: texto del campo
 *
 * Patrón clave: el último mensaje assistant se va construyendo en vivo
 * a partir de los `text_delta`. Mientras el agente trabaja en tools, se
 * muestra un indicador "Trabajando en tu web…" en lugar del mensaje.
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Si true, este mensaje se está construyendo en vivo. */
  streaming?: boolean;
}

interface ChatPaneProps {
  siteId: string;
  /** Conversación inicial (puede ser null si no hay todavía). */
  initialConversationId: string | null;
  /** Mensajes ya persistidos al cargar la página. */
  initialMessages: ChatMessage[];
  /** Callback cuando el agente modifica el JSON: recargar iframe. */
  onStateChanged: () => void;
  /** Si true, el input se desactiva (paywall). */
  disabled?: boolean;
}

type Status = 'idle' | 'thinking' | 'working' | 'streaming';

export function ChatPane({
  siteId,
  initialConversationId,
  initialMessages,
  onStateChanged,
  disabled = false,
}: ChatPaneProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId
  );
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState('Trabajando en tu web…');

  const handleRef = useRef<AgentChatHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll al fondo en cada cambio
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, status]);

  // Cancelar al desmontar (evita streams huérfanos)
  useEffect(() => () => handleRef.current?.abort(), []);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || status !== 'idle') return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      };
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: '',
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
      setStatus('thinking');

      handleRef.current = startAgentChat(
        { siteId, message: trimmed, conversationId },
        (event) => {
          switch (event.type) {
            case 'status':
              setStatusMessage(event.message);
              setStatus('working');
              break;

            case 'text_delta':
              setStatus('streaming');
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (!last || last.role !== 'assistant') return prev;
                const next = [...prev];
                next[next.length - 1] = {
                  ...last,
                  text: last.text + event.delta,
                };
                return next;
              });
              break;

            case 'state_changed':
              onStateChanged();
              break;

            case 'done':
              setConversationId(event.conversationId);
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (!last || last.role !== 'assistant') return prev;
                const next = [...prev];
                next[next.length - 1] = {
                  ...last,
                  text: event.finalText || last.text,
                  streaming: false,
                };
                return next;
              });
              setStatus('idle');
              break;

            case 'error':
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (!last || last.role !== 'assistant') return prev;
                const next = [...prev];
                next[next.length - 1] = {
                  ...last,
                  text: event.message,
                  streaming: false,
                };
                return next;
              });
              setStatus('idle');
              break;
          }
        }
      );
    },
    [conversationId, input, onStateChanged, siteId, status]
  );

  const isBusy = status !== 'idle' || disabled;
  const showWorkingIndicator = status === 'thinking' || status === 'working';

  return (
    <div className="flex h-full flex-col">
      {/* Header del chat */}
      <header className="border-b border-line px-6 py-4">
        <p className="text-xs uppercase tracking-caps text-ink-mute">
          Asistente
        </p>
        <h2 className="mt-1 font-display text-2xl tracking-display text-ink-strong">
          Lúa
        </h2>
      </header>

      {/* Lista de mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="text-base leading-body text-ink-mute">
            <p>
              Cuéntame de qué va tu proyecto en una frase. Por ejemplo:{' '}
              <span className="italic">«Una cafetería de especialidad en Vigo»</span>{' '}
              o{' '}
              <span className="italic">«Soy ilustradora freelance»</span>.
            </p>
            <p className="mt-3">
              Monto una primera versión y la ajustamos hablando.
            </p>
          </div>
        )}

        <ul className="space-y-6">
          {messages.map((msg) => {
            // Mientras el último assistant esté en thinking/working,
            // mostramos indicador en lugar del bubble vacío.
            const isLastAssistantInWork =
              msg.role === 'assistant' &&
              msg.streaming &&
              showWorkingIndicator &&
              msg === messages[messages.length - 1];

            if (isLastAssistantInWork) {
              return (
                <li key={msg.id}>
                  <WorkingIndicator label={statusMessage} />
                </li>
              );
            }

            return (
              <li key={msg.id}>
                <Bubble role={msg.role} text={msg.text} streaming={msg.streaming} />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-line px-6 py-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={isBusy}
            rows={1}
            placeholder={
              disabled
                ? 'Activá tu plan para seguir editando con Lúa'
                : isBusy
                  ? 'Lúa está respondiendo…'
                  : 'Escribe lo que quieres cambiar…'
            }
            className="block min-h-[44px] flex-1 resize-none rounded-sm border border-line bg-surface px-3 py-3 text-sm text-ink-strong outline-none transition-colors focus:border-ink-strong disabled:cursor-not-allowed disabled:opacity-60"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-ink-strong text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Enviar"
          >
            <Icon name="arrow-up-right" size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Bubble({
  role,
  text,
  streaming,
}: {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-ink-strong px-4 py-3 text-sm leading-body text-canvas-pure">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="text-base leading-body text-ink">
      <span className="whitespace-pre-wrap">{text}</span>
      {streaming && text.length > 0 && (
        <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-ink-mute align-middle" />
      )}
    </div>
  );
}

function WorkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-mute">
      <span className="flex gap-1">
        <Dot delay="0ms" />
        <Dot delay="120ms" />
        <Dot delay="240ms" />
      </span>
      <span>{label}</span>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className={cn('inline-block h-1.5 w-1.5 rounded-pill bg-ink-mute opacity-50')}
      style={{
        animation: 'cw-bounce 1.4s ease-in-out infinite',
        animationDelay: delay,
      }}
    />
  );
}
