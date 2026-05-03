import Link from 'next/link';

import { Icon } from '@/components/ui/icon';

/**
 * Banner de paywall.
 *
 * Se muestra en el builder cuando el usuario no tiene suscripción
 * y el grace period de 24h expiró. NO bloquea el builder — el usuario
 * puede seguir viendo su sitio, pero el chat con Lúa se desactiva.
 *
 * Decisión: paywall suave. No queremos que el usuario pierda su trabajo.
 * Solo impedimos que siga usando el agente IA hasta que pague.
 */

export function PaywallBanner() {
  return (
    <div className="border-b border-accent-yellow-bg bg-accent-yellow-bg/30">
      <div className="mx-auto flex max-w-canvas flex-col items-start gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-yellow-fg">
            Tu periodo de prueba terminó
          </p>
          <p className="mt-0.5 text-xs text-accent-yellow-fg/70">
            Tu sitio sigue en línea. Para seguir editando con Lúa, activá tu plan.
          </p>
        </div>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 rounded-sm bg-ink-strong px-4 py-2 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97]"
        >
          Activar plan
          <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    </div>
  );
}

/**
 * Banner de grace period — informativo, no bloqueante.
 * Muestra cuánto tiempo le queda antes de necesitar pagar.
 */
export function GracePeriodBanner({ hoursLeft }: { hoursLeft: number }) {
  if (hoursLeft > 12) return null; // Solo mostrar en las últimas 12h

  return (
    <div className="border-b border-line bg-surface-bone">
      <div className="mx-auto flex max-w-canvas items-center justify-between px-6 py-3 text-xs text-ink-mute">
        <p>
          Estás en el periodo de prueba gratuito.{' '}
          {hoursLeft > 1
            ? `Te quedan ${Math.ceil(hoursLeft)} horas.`
            : 'Termina pronto.'}
        </p>
        <Link
          href="/settings/billing"
          className="underline underline-offset-2 hover:text-ink-strong"
        >
          Activar plan →
        </Link>
      </div>
    </div>
  );
}
