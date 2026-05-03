import { Icon } from '@/components/ui/icon';
import { detectCountry } from '@/lib/geo';
import { PLANS, DEFAULT_PLAN, getPricing } from '@/lib/stripe/plans';
import { createServerClient } from '@/lib/supabase/server';

import {
  cancelMercadoPagoAction,
  openPortalAction,
  startCheckoutAction,
} from './actions';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: sub }, geo] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('status, current_period_end, cancel_at_period_end, provider, currency')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    detectCountry(),
  ]);

  const plan = PLANS[DEFAULT_PLAN];
  const pricing = getPricing(DEFAULT_PLAN, geo.provider);
  const hasActive = sub && ['active', 'trialing'].includes(sub.status);
  const isMpSub = sub?.provider === 'mercadopago';

  return (
    <main className="mx-auto max-w-editorial px-5 pb-20 pt-28 md:px-10 md:pb-32 md:pt-36">
      <a
        href="/settings"
        className="text-sm text-ink-mute hover:text-ink-strong"
      >
        ← Ajustes
      </a>
      <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-display text-ink-strong">
        Pagos y facturación
      </h1>

      {params.error === 'no_customer' && (
        <p className="mt-6 rounded-sm border border-accent-yellow-bg bg-accent-yellow-bg/40 px-4 py-3 text-sm text-accent-yellow-fg">
          Aún no tienes una cuenta de pago. Empieza con la prueba para crearla.
        </p>
      )}

      {params.canceled === '1' && (
        <p className="mt-6 rounded-sm border border-line bg-surface-bone px-4 py-3 text-sm text-ink">
          Tu suscripción se ha cancelado. Seguirás teniendo acceso hasta el final del periodo.
        </p>
      )}

      {/* Badge de país detectado */}
      {geo.countryCode && (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
          {geo.isArgentina
            ? 'Precios en pesos argentinos via MercadoPago'
            : `Precios en USD via Stripe · Detectado: ${geo.countryCode}`}
        </p>
      )}

      <article className="mt-8 rounded-lg border border-line p-6 md:p-10">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
          {plan.name}
        </p>
        <p className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-display text-ink-strong">
          {pricing.display}
          <span className="ml-1 font-sans text-base font-normal tracking-normal text-ink-mute">
            / mes
          </span>
        </p>

        {geo.isArgentina && (
          <p className="mt-2 text-xs text-ink-faint">
            Cobro en pesos argentinos. El dinero llega directo a tu cuenta.
          </p>
        )}

        <p className="mt-4 max-w-prose text-sm text-ink-mute">
          {plan.description}
        </p>

        <ul className="mt-7 flex flex-col gap-2.5">
          {[
            'Un sitio publicado en tu-nombre.cloudweb.app',
            'Edición conversacional con Lúa',
            '12 componentes profesionales, 2 variantes cada uno',
            'SSL incluido, sin configuración',
            'Publicación ilimitada',
          ].map((item) => (
            <li
              key={item}
              className="relative pl-5 text-sm leading-relaxed text-ink-mute before:absolute before:left-0 before:font-mono before:text-xs before:text-ink-faint before:content-['—']"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {hasActive ? (
            // Tiene suscripción activa: mostrar gestión
            isMpSub ? (
              // MercadoPago: botón de cancelar (MP no tiene portal)
              <form action={cancelMercadoPagoAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-5 py-3 text-sm text-ink-strong transition-colors hover:bg-surface-bone"
                >
                  Cancelar suscripción
                </button>
                <p className="mt-3 text-xs text-ink-faint">
                  Seguirás teniendo acceso hasta el final del periodo de pago actual.
                </p>
              </form>
            ) : (
              // Stripe: portal de cliente
              <form action={openPortalAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-sm bg-ink-strong px-5 py-3 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97]"
                >
                  Gestionar suscripción
                  <Icon name="arrow-up-right" size={16} />
                </button>
                <p className="mt-3 text-xs text-ink-faint">
                  Portal de Stripe: cambiar método de pago, facturas o cancelar.
                </p>
              </form>
            )
          ) : (
            // Sin suscripción: checkout
            <>
              <form action={startCheckoutAction}>
                <input type="hidden" name="provider" value={geo.provider} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink-strong px-6 py-3.5 text-[15px] text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97] sm:w-auto"
                >
                  Empezar {plan.trialDays} días gratis
                  <Icon name="arrow-right" size={16} />
                </button>
              </form>
              <p className="mt-3 text-xs text-ink-faint">
                {geo.isArgentina
                  ? 'Pagas con MercadoPago. Sin tarjeta hasta el final de la prueba.'
                  : 'Sin tarjeta hasta el final de la prueba.'}
              </p>

              {/* Opción de cambiar provider manualmente */}
              {geo.isArgentina ? (
                <form action={startCheckoutAction} className="mt-6">
                  <input type="hidden" name="provider" value="stripe" />
                  <button
                    type="submit"
                    className="text-xs text-ink-faint underline underline-offset-2 hover:text-ink-mute"
                  >
                    Prefiero pagar en USD con tarjeta internacional
                  </button>
                </form>
              ) : (
                geo.countryCode && (
                  <form action={startCheckoutAction} className="mt-6">
                    <input type="hidden" name="provider" value="mercadopago" />
                    <button
                      type="submit"
                      className="text-xs text-ink-faint underline underline-offset-2 hover:text-ink-mute"
                    >
                      Soy de Argentina, pagar en pesos
                    </button>
                  </form>
                )
              )}
            </>
          )}
        </div>
      </article>
    </main>
  );
}
