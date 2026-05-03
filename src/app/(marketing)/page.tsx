import Link from 'next/link';

import { Icon } from '@/components/ui/icon';
import { detectCountry } from '@/lib/geo';
import { PLANS, DEFAULT_PLAN, getPricing } from '@/lib/stripe/plans';

/**
 * Landing page — cloudweb.app
 *
 * Monocromática, editorial, mobile-first. Sin clichés, sin gradientes,
 * sin sombras pesadas. Cada sección separada solo por border-top.
 *
 * Detección automática de país: si el visitante está en Argentina,
 * muestra precios en ARS. Si no, USD.
 */

export default async function LandingPage() {
  const geo = await detectCountry();
  const pricing = getPricing(DEFAULT_PLAN, geo.provider);
  const plan = PLANS[DEFAULT_PLAN];

  return (
    <>
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <CasesSection />
      <PricingSection
        priceDisplay={pricing.display}
        currencyLabel={geo.isArgentina ? 'ARS' : 'USD'}
        isArgentina={geo.isArgentina}
        trialDays={plan.trialDays}
      />
      <FinalCTASection />
    </>
  );
}

/* =========================================================================
   Hero — 100svh, chat mockup
   ========================================================================= */
function HeroSection() {
  return (
    <section className="flex min-h-svh flex-col justify-center px-5 pb-16 pt-24 md:px-10">
      <div className="mx-auto w-full max-w-canvas">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
          Crea tu web hablando
        </p>

        <h1 className="mt-5 max-w-[14ch] font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[1.0] tracking-display text-ink-strong">
          Tu sitio, creado en conversación.
        </h1>

        <p className="mt-6 max-w-[480px] text-[clamp(16px,2.5vw,20px)] leading-body text-ink-mute">
          Cuéntale a Lúa de qué va tu negocio. En cinco minutos tienes una
          primera versión. La ajustas hablando, no arrastrando bloques.
          La publicas en un clic.
        </p>

        <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink-strong px-7 py-3.5 text-[15px] text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97] sm:w-auto"
          >
            Empezar gratis
            <Icon name="arrow-right" size={16} />
          </Link>
          <Link
            href="#precio"
            className="text-sm text-ink-mute transition-colors hover:text-ink-strong"
          >
            Ver precio →
          </Link>
        </div>

        {/* Chat mockup */}
        <div className="mt-14 max-w-xl overflow-hidden rounded-lg border border-line">
          <div className="flex items-center gap-2 border-b border-line bg-surface-warm px-4 py-3">
            <span className="h-2 w-2 rounded-pill bg-ink-faint" />
            <span className="h-2 w-2 rounded-pill bg-ink-faint" />
            <span className="h-2 w-2 rounded-pill bg-ink-faint" />
            <span className="ml-2 font-mono text-[11px] tracking-[0.04em] text-ink-mute">
              Lúa — asistente de CloudWeb
            </span>
          </div>
          <div className="flex flex-col gap-4 bg-canvas-pure p-5">
            <div className="max-w-[85%] self-end rounded-lg bg-ink-strong px-4 py-3 text-sm leading-relaxed text-canvas-pure">
              Tengo una cafetería de especialidad en Vigo, con tostado propio.
            </div>
            <div className="max-w-[85%] self-start rounded-lg bg-surface-warm px-4 py-3 text-sm leading-relaxed text-ink">
              He montado una primera versión con hero, tres puntos destacados
              y contacto con horarios. ¿Cómo se llama tu cafetería?
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Demo — 3 pasos + preview simulado
   ========================================================================= */
function DemoSection() {
  return (
    <section className="border-t border-line px-5 py-20 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-canvas">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
          Cómo funciona
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-display text-ink-strong">
          Tres pasos. Cinco minutos.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line md:grid-cols-[1fr_1.6fr]">
          {/* Steps */}
          <div className="flex flex-col gap-5 bg-surface-warm p-6 md:p-8">
            {[
              ['01', 'Describe tu negocio', 'en una frase. Lúa elige un template y lo rellena con copy realista.'],
              ['02', 'Ajusta hablando.', '"Cambia el titular", "pon los horarios del finde", "añade testimonios". Lúa lo hace al instante.'],
              ['03', 'Di "publica"', 'y tu web está en vivo en tu-cafe.cloudweb.app con SSL incluido.'],
            ].map(([num, title, text]) => (
              <div key={num} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-line font-mono text-[10px] text-ink-mute">
                  {num}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-ink-mute">
                  <strong className="font-medium text-ink-strong">{title}</strong>{' '}
                  {text}
                </p>
              </div>
            ))}
          </div>

          {/* Preview simulation */}
          <div className="flex min-h-[300px] flex-col items-center justify-center bg-surface-bone p-10 text-center md:min-h-[420px]">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
              Vista previa en vivo
            </p>
            <h3 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.1] tracking-display text-ink-strong">
              Café Lúa
            </h3>
            <p className="mt-3 max-w-[280px] text-sm text-ink-mute">
              Tostado propio en el centro de Vigo. Café como debería ser.
            </p>
            <p className="mt-6 font-mono text-[11px] text-ink-faint">
              cafe-lua.cloudweb.app
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Features — grid asimétrico, primera celda invertida
   ========================================================================= */
function FeaturesSection() {
  const features = [
    {
      num: '01',
      title: 'Agente IA que construye de verdad',
      desc: 'Lúa no sugiere. Hace. Elige componentes, escribe copy realista, cambia layouts. Tú solo describes lo que quieres.',
      invert: true,
    },
    {
      num: '02',
      title: 'Preview en vivo',
      desc: 'Ves cómo cambia tu web mientras hablas. Cada cambio se refleja al instante.',
    },
    {
      num: '03',
      title: 'Publicación en un clic',
      desc: 'Tu sitio en tu-nombre.cloudweb.app con SSL. Sin FTP, sin configuración, sin esperar.',
    },
    {
      num: '04',
      title: 'Diseño editorial',
      desc: 'Tipografía de alto contraste, paleta monocromática, espaciado generoso. Tu web parece hecha por un diseñador.',
    },
    {
      num: '05',
      title: '12 componentes profesionales',
      desc: 'Hero, features, testimonios, contacto, FAQ, footer. Cada uno con dos variantes para diferentes estilos.',
    },
  ];

  return (
    <section className="border-t border-line px-5 py-20 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-canvas">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
          Lo que incluye
        </p>
        <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-display text-ink-strong">
          Sin pelea con builders.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.num}
              className={`p-6 md:p-10 ${
                f.invert
                  ? 'bg-ink-strong text-canvas-pure sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:flex lg:flex-col lg:justify-center'
                  : 'bg-canvas-pure'
              }`}
            >
              <span
                className={`mb-5 flex h-7 w-7 items-center justify-center rounded-pill border font-mono text-[10px] ${
                  f.invert
                    ? 'border-[#444] text-[#888]'
                    : 'border-line text-ink-faint'
                }`}
              >
                {f.num}
              </span>
              <h3
                className={`mb-2 text-[16px] font-medium ${
                  f.invert ? 'text-canvas-pure' : 'text-ink-strong'
                }`}
              >
                {f.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  f.invert ? 'text-[#999]' : 'text-ink-mute'
                }`}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Cases — 3 ejemplos de webs generadas
   ========================================================================= */
function CasesSection() {
  const cases = [
    {
      name: 'Marina Solé',
      type: 'Ilustración · Barcelona',
      desc: 'Portfolio de ilustradora',
      detail: 'Hero con imagen, sección de servicios y formulario de contacto para encargos.',
      time: '8 min',
    },
    {
      name: 'Café Lúa',
      type: 'Hostelería · Vigo',
      desc: 'Web de cafetería',
      detail: 'Hero, tres puntos destacados, horarios y ubicación. Con testimonio de cliente.',
      time: '6 min',
    },
    {
      name: 'Nadia Cortés',
      type: 'Consultoría · Madrid',
      desc: 'Servicios de consultoría',
      detail: 'Proceso en 3 pasos, testimonios de clientes, FAQ y formulario de contacto.',
      time: '12 min',
    },
  ];

  return (
    <section className="border-t border-line px-5 py-20 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-canvas">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
          Quién lo usa
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-display text-ink-strong">
          Webs reales, creadas hablando.
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {cases.map((c) => (
            <div
              key={c.name}
              className="overflow-hidden rounded-lg border border-line transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex aspect-[4/3] flex-col items-center justify-center border-b border-line bg-surface-bone p-6 text-center">
                <p className="font-display text-[clamp(1.4rem,3vw,1.8rem)] leading-[1.1] tracking-display text-ink-strong">
                  {c.name}
                </p>
                <p className="mt-1.5 text-xs text-ink-faint">{c.type}</p>
              </div>
              <div className="p-5">
                <p className="text-sm font-medium text-ink-strong">{c.desc}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-mute">
                  {c.detail}
                </p>
                <p className="mt-2.5 font-mono text-[11px] text-ink-faint">
                  Creado en {c.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Pricing — descentrado, una sola tarjeta, precio adaptado al país
   ========================================================================= */
function PricingSection({
  priceDisplay,
  currencyLabel,
  isArgentina,
  trialDays,
}: {
  priceDisplay: string;
  currencyLabel: string;
  isArgentina: boolean;
  trialDays: number;
}) {
  return (
    <section id="precio" className="border-t border-line px-5 py-20 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-canvas">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-20">
          {/* Left */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
              Precio
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-display text-ink-strong">
              Un plan. Sin sorpresas.
            </h2>
            <p className="mt-4 text-base leading-body text-ink-mute">
              {trialDays} días de prueba sin tarjeta. Si en ese tiempo publicas tu web y
              te resulta útil, ya tienes tu respuesta. Si no, no pagas nada.
            </p>
            {isArgentina && (
              <p className="mt-3 text-sm text-ink-faint">
                Pagás con MercadoPago, en pesos argentinos.
              </p>
            )}
          </div>

          {/* Card */}
          <div className="rounded-lg border border-line p-6 md:p-10">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
              CloudWeb Pro
            </p>
            <p className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-none tracking-display text-ink-strong">
              {priceDisplay}
              <span className="ml-1 font-sans text-base font-normal tracking-normal text-ink-mute">
                / mes
              </span>
            </p>

            {isArgentina && (
              <p className="mt-1 font-mono text-[11px] text-ink-faint">
                {currencyLabel} · MercadoPago
              </p>
            )}

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
                  className="relative pl-5 text-sm leading-relaxed text-ink-mute before:absolute before:left-0 before:content-['—'] before:font-mono before:text-xs before:text-ink-faint"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink-strong px-6 py-3.5 text-[15px] text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97] sm:w-auto"
              >
                Empezar {trialDays} días gratis
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              {isArgentina
                ? 'Pagás con MercadoPago. Sin tarjeta hasta el final de la prueba.'
                : 'Sin tarjeta hasta el final de la prueba.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Final CTA
   ========================================================================= */
function FinalCTASection() {
  return (
    <section className="border-t border-line px-5 py-20 text-center md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-canvas">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-mute">
          Listo para empezar
        </p>
        <h2 className="mx-auto mt-4 max-w-[14ch] font-display text-[clamp(2.2rem,6vw,4.5rem)] leading-[1.0] tracking-display text-ink-strong">
          Tu web en cinco minutos. No la semana que viene.
        </h2>
        <p className="mx-auto mt-5 max-w-[440px] text-base leading-body text-ink-mute">
          Describe tu negocio en una frase. Lúa hace el resto.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-sm bg-ink-strong px-7 py-3.5 text-[15px] text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97]"
        >
          Crear mi sitio
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </section>
  );
}
