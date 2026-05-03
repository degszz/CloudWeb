'use client';

import { Icon } from '@/components/ui/icon';

export default function BuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[calc(100vh-65px)] items-center justify-center">
      <div className="mx-auto max-w-md px-6 text-center">
        <Icon
          name="x"
          size={32}
          weight="bold"
          className="mx-auto text-ink-mute"
        />
        <h2 className="mt-6 font-display text-3xl tracking-display text-ink-strong">
          Algo no fue bien.
        </h2>
        <p className="mt-3 text-ink-mute">
          No se pudo cargar el builder. Si vuelve a pasar, escríbenos a{' '}
          <a
            href="mailto:hola@cloudweb.app"
            className="underline underline-offset-2 hover:text-ink-strong"
          >
            hola@cloudweb.app
          </a>
          .
        </p>
        <button
          onClick={() => reset()}
          className="mt-8 inline-flex items-center gap-2 rounded-sm bg-ink-strong px-5 py-3 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.98]"
        >
          Intentar de nuevo
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}
