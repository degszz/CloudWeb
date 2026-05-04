import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { PLANS } from '@/lib/stripe/plans';

const plan = PLANS['nuweb-pro'];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-canvas px-5 pb-20 pt-28 md:px-10 md:pb-32 md:pt-36">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
        Precio
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4rem)] leading-[1.05] tracking-display text-ink-strong">
        Un plan. Sin sorpresas.
      </h1>
      <p className="mt-4 max-w-prose text-base text-ink-mute">
        14 días de prueba sin tarjeta. Después, {plan.pricing.stripe.display}/mes.
        Cancela cuando quieras.
      </p>

      <article className="mt-12 max-w-lg rounded-lg border border-line p-6 md:p-10">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
          {plan.name}
        </p>
        <p className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-display text-ink-strong">
          {plan.pricing.stripe.display}
          <span className="ml-1 font-sans text-base font-normal tracking-normal text-ink-mute">
            / mes
          </span>
        </p>
        <p className="mt-4 max-w-prose text-sm text-ink-mute">{plan.description}</p>

        <ul className="mt-7 flex flex-col gap-2.5">
          {[
            `Un sitio publicado en {nombre}.nuweb.app`,
            'Edición conversacional con Lúa, la asistente de IA',
            'Tres templates iniciales (portfolio, servicios, hostelería)',
            'SSL incluido, sin configuración',
          ].map((item) => (
            <li
              key={item}
              className="relative pl-5 text-sm leading-relaxed text-ink-mute before:absolute before:left-0 before:font-mono before:text-xs before:text-ink-faint before:content-['—']"
            >
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/login"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink-strong px-6 py-3.5 text-[15px] text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97] sm:w-auto"
        >
          Empezar {plan.trialDays} días gratis
          <Icon name="arrow-right" size={16} />
        </Link>
      </article>
    </main>
  );
}
