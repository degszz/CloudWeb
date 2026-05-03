'use client';

import { useCallback, useState } from 'react';

import { ChatPane } from '@/components/builder/chat-pane';
import { PreviewPane } from '@/components/builder/preview-pane';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

/**
 * Shell del builder.
 *
 * Decisión #2:
 *   - Desktop (md+): chat 33% izq + preview 67% der, ambos visibles
 *   - Mobile: preview a pantalla completa, chat como drawer desde abajo
 *
 * El estado `reloadKey` se incrementa con cada `state_changed` del runner,
 * lo que fuerza re-mount del iframe (decisión #3: server-rendered iframe).
 */

interface InitialChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface BuilderShellProps {
  siteId: string;
  initialConversationId: string | null;
  initialMessages: InitialChatMessage[];
  previewUrl: string;
  publishedUrl: string | null;
  /** Si true, el chat se desactiva (paywall activo). */
  chatDisabled?: boolean;
}

export function BuilderShell({
  siteId,
  initialConversationId,
  initialMessages,
  previewUrl,
  publishedUrl,
  chatDisabled = false,
}: BuilderShellProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isChatOpenMobile, setIsChatOpenMobile] = useState(true);

  const handleStateChanged = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col md:grid md:grid-cols-[minmax(360px,33%)_1fr]">
      {/* Chat — drawer en mobile, columna en desktop */}
      <aside
        className={cn(
          'border-line bg-canvas md:relative md:border-r',
          // Mobile: fixed drawer
          'fixed inset-x-0 bottom-0 z-20 transform border-t transition-transform duration-300 md:static md:transform-none',
          isChatOpenMobile ? 'translate-y-0' : 'translate-y-[calc(100%-3.5rem)]'
        )}
        style={{
          // Mobile drawer height
          height: '70vh',
          maxHeight: '70vh',
        }}
      >
        {/* Toggle handle (solo mobile) */}
        <button
          type="button"
          onClick={() => setIsChatOpenMobile((v) => !v)}
          className="flex h-14 w-full items-center justify-between gap-2 border-b border-line px-6 text-sm md:hidden"
          aria-expanded={isChatOpenMobile}
          aria-label={isChatOpenMobile ? 'Minimizar chat' : 'Abrir chat'}
        >
          <span className="flex items-center gap-2 text-ink-strong">
            <span className="font-display text-lg tracking-display">Lúa</span>
            <span className="text-ink-mute">— tu asistente</span>
          </span>
          <Icon
            name="chevron-down"
            size={16}
            className={cn(
              'transition-transform duration-200',
              isChatOpenMobile ? '' : 'rotate-180'
            )}
          />
        </button>

        <div className="h-[calc(70vh-3.5rem)] md:h-full">
          <ChatPane
            siteId={siteId}
            initialConversationId={initialConversationId}
            initialMessages={initialMessages}
            onStateChanged={handleStateChanged}
            disabled={chatDisabled}
          />
        </div>
      </aside>

      {/* Preview */}
      <main className="h-full">
        <PreviewPane
          previewUrl={previewUrl}
          reloadKey={reloadKey}
          publishedUrl={publishedUrl}
        />
      </main>
    </div>
  );
}
