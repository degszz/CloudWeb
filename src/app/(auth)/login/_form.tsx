'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';

import { Icon } from '@/components/ui/icon';
import { sendMagicLink, type MagicLinkState } from '@/app/(auth)/actions';

interface MagicLinkFormProps {
  /** Ruta a la que redirigir tras login. */
  next?: string;
}

export function MagicLinkForm({ next = '/dashboard' }: MagicLinkFormProps) {
  const [state, formAction] = useActionState<MagicLinkState | null, FormData>(
    sendMagicLink,
    null
  );

  return (
    <form action={formAction} className="mt-10 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {/* Honeypot anti-bot (oculto a humanos, visible a scrapers) */}
      <div aria-hidden className="hidden">
        <label>
          No rellenar
          <input
            type="text"
            name="hp"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-caps text-ink-mute">
          Tu email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="hola@tudominio.com"
          className="mt-2 block w-full rounded-sm border border-line bg-surface px-3 py-3 text-base text-ink-strong outline-none transition-colors focus:border-ink-strong"
        />
      </label>

      {state && state.ok === false && (
        <p className="text-sm text-accent-red-fg">{state.error}</p>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink-strong px-4 py-3 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Enviando…' : (
        <>
          Enviar enlace
          <Icon name="arrow-right" size={16} />
        </>
      )}
    </button>
  );
}
