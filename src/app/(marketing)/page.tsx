import Link from 'next/link';

import { CloudScrollLazy as CloudScroll } from '@/components/landing/cloud-scroll-lazy';
import { HeroSceneLazy as HeroScene } from '@/components/landing/hero-scene-lazy';
import { LuaChatLazy as LuaChat } from '@/components/landing/lua-chat-lazy';
import { detectCountry } from '@/lib/geo';
import { DEFAULT_PLAN, getPricing, PLANS } from '@/lib/stripe/plans';

export default async function LandingPage() {
  const geo = await detectCountry();
  const pricing = getPricing(DEFAULT_PLAN, geo.provider);
  const plan = PLANS[DEFAULT_PLAN];

  return (
    <>
      <Hero />
      <CloudScroll />
      <Demo />
      <Features />
      <HowItWorks />
      <WhoUsesIt />
      <Pricing
        priceDisplay={pricing.display}
        isArgentina={geo.isArgentina}
        trialDays={plan.trialDays}
      />
      <FinalCTA trialDays={plan.trialDays} />
    </>
  );
}

/* =========================================================================
   HERO — 100vh, 3D canvas, chat de Lúa
   ========================================================================= */
function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'grid',
        gridTemplateRows: '1fr auto',
        padding: '0 28px 28px',
        overflow: 'hidden',
      }}
    >
      {/* 3D background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <HeroScene />
      </div>

      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }}
      />

      {/* Spacer */}
      <div />

      {/* Content */}
      <div
        style={{
          position: 'relative', zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 40,
          alignItems: 'end',
        }}
        className="hero-content"
      >
        <div>
          {/* Meta */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 24px',
              marginBottom: 16,
            }}
          >
            <span>
              <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>v1.0</strong>
              {' '}· MVP
            </span>
            <span style={{ color: 'var(--ink-3)' }}>tu-nombre.nuweb.app</span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(4rem, 14vw, 13rem)',
              lineHeight: 0.88,
              letterSpacing: '-0.055em',
              color: 'var(--ink-strong)',
              marginBottom: 0,
            }}
          >
            <span style={{ display: 'block' }}>Habla.</span>
            <em style={{ display: 'block', fontStyle: 'italic', fontWeight: 400 }}>
              Publica.
            </em>
            <span
              style={{
                display: 'block',
                fontSize: '0.4em',
                letterSpacing: '-0.03em',
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'var(--ink-2)',
                marginTop: 14,
              }}
            >
              tu web, en una conversación.
            </span>
          </h1>

          <div
            style={{
              marginTop: 32,
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                background: 'var(--ink-strong)',
                color: 'var(--bg)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                border: '1px solid var(--ink-strong)',
                transition: 'all 0.2s',
              }}
            >
              empezar gratis →
            </Link>
            <Link
              href="#precio"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-2)',
                borderBottom: '1px solid var(--line-hard)',
                paddingBottom: 2,
              }}
            >
              ver precio
            </Link>
          </div>
        </div>

        {/* Chat widget */}
        <div className="hero-chat-aside">
          <LuaChat />
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: 'relative', zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--ink-2)',
          }}
        >
          scroll
          <span
            style={{
              width: 60, height: 1,
              background: 'var(--ink-3)',
              position: 'relative', overflow: 'hidden',
              display: 'inline-block',
            }}
          >
            <span
              style={{
                position: 'absolute', top: 0, left: '-100%',
                width: '100%', height: '100%',
                background: 'var(--ink)',
                animation: 'cw-slide 2.2s infinite',
              }}
            />
          </span>
          sigue
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
          }}
        >
          arrastrá el objeto · interactivo
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .hero-content {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .hero-chat-aside { width: 100% !important; max-width: 500px; }
        }
        @media (max-width: 600px) {
          .hero-content { padding-top: 80px; }
        }
      `}</style>
    </section>
  );
}

/* =========================================================================
   DEMO — chat + preview side by side
   ========================================================================= */
function Demo() {
  const messages = [
    { role: 'lua', text: '¿Qué tipo de negocio es?' },
    { role: 'you', text: 'una librería independiente. se llama Subterránea.' },
    { role: 'lua', text: '¿Querés tienda online o vitrina con horarios y eventos?' },
    { role: 'you', text: 'vitrina, eventos y un boletín mensual.' },
    { role: 'lua', text: 'Hecho. Tipografía editorial, fondo crudo, calendario abajo. Mirá a la derecha.' },
    { role: 'you', text: 'el título un poco más grande.' },
    { role: 'lua', text: '¿Publicamos en subterranea.nuweb.app?' },
  ];

  return (
    <section style={{ padding: '120px 28px', borderTop: '1px solid var(--line-hard)' }} id="demo">
      <SecLabel num="01 / demo" right="describís y aparece" />
      <h2
        style={{
          fontFamily: 'var(--font-fraunces, var(--font-display))',
          fontWeight: 300,
          fontSize: 'clamp(2.2rem, 6vw, 5rem)',
          lineHeight: 0.92,
          letterSpacing: '-0.05em',
          color: 'var(--ink-strong)',
          maxWidth: '18ch',
          margin: '24px 0 60px',
        }}
      >
        No <em style={{ fontStyle: 'italic', fontWeight: 400 }}>diseñás.</em> Lo contás y se construye{' '}
        <em style={{ fontStyle: 'italic', fontWeight: 400 }}>delante</em> de vos.
      </h2>

      <div
        className="demo-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          border: '1px solid var(--line-hard)',
        }}
      >
        {/* Chat column */}
        <div
          style={{
            padding: 28,
            borderRight: '1px solid var(--line-hard)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'var(--bg-2)',
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'you' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                padding: '8px 12px',
                ...(m.role === 'lua'
                  ? {
                      background: 'var(--surface)',
                      borderLeft: '2px solid var(--ink-strong)',
                      fontFamily: 'var(--font-fraunces, var(--font-display))',
                      fontStyle: 'italic',
                      fontSize: 15,
                      color: 'var(--ink)',
                    }
                  : {
                      background: 'var(--ink-strong)',
                      color: 'var(--bg)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                    }),
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Preview column */}
        <div style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
          {/* Browser bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderBottom: '1px solid var(--line)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-3)',
            }}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  border: '1px solid var(--line-hard)',
                }}
              />
            ))}
            <span style={{ marginLeft: 12, color: 'var(--ink-2)' }}>
              subterranea.nuweb.app
            </span>
          </div>

          {/* Preview content */}
          <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-2)',
              }}
            >
              librería · buenos aires
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-fraunces, var(--font-display))',
                fontWeight: 300,
                fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
                lineHeight: 0.96,
                letterSpacing: '-0.04em',
                color: 'var(--ink-strong)',
              }}
            >
              Subterránea,{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 400 }}>
                libros que no caben en mesas grandes.
              </em>
            </h3>
            <div
              style={{
                flex: 1,
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                minHeight: 120,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  color: 'var(--ink-3)',
                  textTransform: 'uppercase',
                }}
              >
                imagen principal
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { tag: 'próximo evento', text: 'Lectura · Anne Carson, 12 may' },
                { tag: 'boletín', text: 'cuatro libros al mes, sin spam.' },
              ].map(c => (
                <div
                  key={c.tag}
                  style={{
                    border: '1px solid var(--line)',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                      marginBottom: 6,
                    }}
                  >
                    {c.tag}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-fraunces, var(--font-display))',
                      fontSize: 16,
                      lineHeight: 1.1,
                      color: 'var(--ink)',
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ padding: '6px 10px', border: '1px solid var(--line-hard)', color: 'var(--ink)' }}>
          [ describís ]
        </span>
        <span>↳ ajustás hablando ↲</span>
        <span style={{ padding: '6px 10px', border: '1px solid var(--line-hard)', color: 'var(--ink)' }}>
          [ publicás ]
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* =========================================================================
   FEATURES — bento grid
   ========================================================================= */
function Features() {
  return (
    <section style={{ padding: '120px 28px', borderTop: '1px solid var(--line-hard)' }} id="features">
      <SecLabel num="02 / capacidades" right="qué hace, exactamente" />
      <h2
        style={{
          fontFamily: 'var(--font-fraunces, var(--font-display))',
          fontWeight: 300,
          fontSize: 'clamp(2.2rem, 6vw, 5rem)',
          lineHeight: 0.92,
          letterSpacing: '-0.05em',
          color: 'var(--ink-strong)',
          maxWidth: '16ch',
          margin: '24px 0 50px',
        }}
      >
        Una caja{' '}
        <em style={{ fontStyle: 'italic', fontWeight: 400 }}>de herramientas</em>{' '}
        que solo necesita que hables.
      </h2>

      <div className="bento-grid">
        {/* Cell 1 — Lúa, grande */}
        <BentoCell className="bento-c1" tag="[ agente · lúa ]" accent>
          <div
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              color: 'var(--ink-strong)',
              marginTop: 'auto',
            }}
          >
            Lúa{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>entiende</em>{' '}
            el contexto, no solo las palabras.
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--ink-2)',
              marginTop: 16,
              maxWidth: '36ch',
              background: 'rgba(0,0,0,0.4)',
              padding: '6px 10px',
            }}
          >
            Sabe que un fotógrafo de bodas necesita galerías densas y un consultor
            necesita una página de copy. No te pregunta qué fuente querés.
          </p>
        </BentoCell>

        {/* Cell 2 */}
        <BentoCell className="bento-c2" tag="[ publicación ]">
          <div
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(1.4rem, 2.5vw, 2.2rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              color: 'var(--ink-strong)',
            }}
          >
            Un dominio{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>
              {'{'}tu-nombre{'}'}.nuweb.app
            </em>{' '}
            al instante.
          </div>
        </BentoCell>

        {/* Cell 3 */}
        <BentoCell className="bento-c3" tag="[ formularios ]">
          <div
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(1.3rem, 2vw, 1.9rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.03em',
              color: 'var(--ink-strong)',
            }}
          >
            Reservas, contacto, lista de espera —
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}> ya conectadas.</em>
          </div>
        </BentoCell>

        {/* Cell 4 — inverted */}
        <BentoCell className="bento-c4" tag="[ velocidad ]" inverted>
          <div
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 60,
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              color: 'inherit',
            }}
          >
            100
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: 0 }}>
              /100
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
            PageSpeed por defecto.
          </p>
        </BentoCell>

        {/* Cell 5 */}
        <BentoCell className="bento-c5" tag="[ edición continua ]">
          <div
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(1.3rem, 2vw, 1.9rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.03em',
              color: 'var(--ink-strong)',
            }}
          >
            Seguís hablando.{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Cambiás titulares</em>,
            movés secciones, pedís otra paleta.
          </div>
          <pre
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              lineHeight: 1.7,
              color: 'var(--ink-2)',
              marginTop: 20,
            }}
          >
            {`> "hace el hero más serio"
> "sacá la foto del equipo"
> "más espacio entre títulos"
> "publicá"`}
          </pre>
        </BentoCell>

        {/* Cell 6 */}
        <BentoCell className="bento-c6" tag="[ analítica honesta ]">
          <div
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(1.3rem, 2vw, 1.9rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.03em',
              color: 'var(--ink-strong)',
            }}
          >
            Visitas reales. Sin{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>cookies</em>, sin{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>banners</em>, sin{' '}
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>excusas.</em>
          </div>
        </BentoCell>
      </div>

      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-auto-rows: 200px;
          border: 1px solid var(--line-hard);
        }
        .bento-cell {
          border-right: 1px solid var(--line-hard);
          border-bottom: 1px solid var(--line-hard);
          padding: 24px;
          position: relative;
          overflow: hidden;
          background: var(--bg-2);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: background 0.25s;
        }
        .bento-cell:hover { background: var(--surface); }
        .bento-cell.inverted { background: #e8e8e8 !important; color: #111; }
        .bento-cell.inverted:hover { background: #ffffff !important; }
        [data-theme="light"] .bento-cell.inverted { background: #111 !important; color: #f0f0f0; }
        [data-theme="light"] .bento-cell.inverted:hover { background: #222 !important; }
        .bento-c1 { grid-column: span 3; grid-row: span 2; }
        .bento-c2 { grid-column: span 3; grid-row: span 1; }
        .bento-c3 { grid-column: span 2; grid-row: span 1; }
        .bento-c4 { grid-column: span 1; grid-row: span 1; }
        .bento-c5 { grid-column: span 2; grid-row: span 2; }
        .bento-c6 { grid-column: span 4; grid-row: span 1; }
        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 180px; }
          .bento-c1 { grid-column: span 4; grid-row: span 2; }
          .bento-c2 { grid-column: span 4; }
          .bento-c3 { grid-column: span 2; }
          .bento-c4 { grid-column: span 2; }
          .bento-c5 { grid-column: span 2; grid-row: span 2; }
          .bento-c6 { grid-column: span 2; }
        }
        @media (max-width: 640px) {
          .bento-grid { grid-template-columns: 1fr; grid-auto-rows: auto; }
          .bento-cell { min-height: 160px; }
          .bento-c1,.bento-c2,.bento-c3,.bento-c4,.bento-c5,.bento-c6 {
            grid-column: span 1; grid-row: span 1;
          }
          .bento-c1 { min-height: 240px; }
        }
      `}</style>
    </section>
  );
}

/* =========================================================================
   HOW IT WORKS — 3 pasos con visualizaciones
   ========================================================================= */
function HowItWorks() {
  const steps = [
    {
      num: 'paso uno · ↘ describís',
      title: <>Le <em>contás</em> qué querés.</>,
      body: '"una web para mi taller de bicicletas, con reservas de revisión y un mapa". No hay formularios de onboarding. No hay 47 plantillas. Es una conversación.',
      visual: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '20px',
          }}
        >
          <div
            style={{
              alignSelf: 'flex-end',
              background: 'var(--ink-strong)',
              color: 'var(--bg)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              padding: '10px 14px',
              maxWidth: '80%',
            }}
          >
            una web para mi taller de bicis. quiero reservas y un mapa.
          </div>
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'var(--surface)',
              borderLeft: '2px solid var(--ink-strong)',
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontStyle: 'italic',
              fontSize: 15,
              padding: '10px 14px',
              maxWidth: '80%',
              color: 'var(--ink)',
            }}
          >
            Genial. ¿Reparación, custom, las dos? ¿Vendés piezas online?
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 8 }}>
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 3, background: 'var(--ink-2)', borderRadius: 0,
                  animation: `cw-wave 1.4s ${i * 0.1}s infinite ease-in-out`,
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      num: 'paso dos · ↘ ajustás',
      title: <>Lo <em>retocás</em> hablando.</>,
      body: '"el título más grande", "sacá esa sección", "una paleta más fría". Lúa cambia y vuelve a mostrar. Sin paneles, sin sliders.',
      visual: (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridAutoRows: '1fr',
            gap: 8,
            padding: '20px',
            height: '100%',
          }}
        >
          {[
            { cols: 6, solid: true, delay: 0 },
            { cols: 4, solid: false, delay: 0.2 },
            { cols: 2, solid: true, delay: 0.4 },
            { cols: 2, solid: false, delay: 0.6 },
            { cols: 3, solid: false, delay: 0.5 },
            { cols: 3, solid: true, delay: 0.7 },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                gridColumn: `span ${b.cols}`,
                background: b.solid ? 'var(--ink-strong)' : 'var(--surface)',
                border: '1px solid var(--line-hard)',
                animation: `cw-blink 3s ${b.delay}s infinite cubic-bezier(.7,0,.3,1)`,
              }}
            />
          ))}
        </div>
      ),
    },
    {
      num: 'paso tres · ↘ publicás',
      title: <><em>Vive</em> en un clic.</>,
      body: 'Cuando decís "publicalo", está en internet. SSL, CDN, dominio gratuito incluido. Si querés tu dominio, lo conectás después.',
      visual: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            height: '100%',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.8,
              color: 'var(--ink)',
            }}
          >
            <span style={{ display: 'block', color: 'var(--ink-2)' }}>$ lua publish mi-taller</span>
            <span style={{ display: 'block' }}>✓ build · 2.1s</span>
            <span style={{ display: 'block' }}>✓ ssl · emitido</span>
            <span style={{ display: 'block' }}>✓ cdn · 184 nodos</span>
            <span style={{ display: 'block', color: 'var(--ink-strong)', fontWeight: 600 }}>✓ live · 3.4s</span>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-fraunces, var(--font-display))',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(60px, 10vw, 120px)',
                lineHeight: 0.85,
                letterSpacing: '-0.06em',
                color: 'var(--ink-strong)',
                textAlign: 'right',
              }}
            >
              live.
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                borderTop: '1px solid var(--line-hard)',
                paddingTop: 8,
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--ink-2)',
              }}
            >
              <span>↳ mi-taller.nuweb.app</span>
              <span>0.4s ttfb</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section style={{ padding: '120px 0 0', borderTop: '1px solid var(--line-hard)' }} id="como">
      <div style={{ padding: '0 28px' }}>
        <SecLabel num="03 / proceso" right="tres pasos. uno acaba donde empieza el siguiente." />
        <h2
          style={{
            fontFamily: 'var(--font-fraunces, var(--font-display))',
            fontWeight: 300,
            fontSize: 'clamp(2.2rem, 6vw, 5rem)',
            lineHeight: 0.92,
            letterSpacing: '-0.05em',
            color: 'var(--ink-strong)',
            maxWidth: '12ch',
            margin: '24px 0 50px',
          }}
        >
          Es <em style={{ fontStyle: 'italic', fontWeight: 400 }}>así.</em>
        </h2>
      </div>

      <div
        className="how-steps"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid var(--line-hard)',
        }}
      >
        {steps.map((s, i) => (
          <div
            key={i}
            style={{
              borderRight: i < 2 ? '1px solid var(--line-hard)' : undefined,
              padding: '40px 28px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink-2)',
                marginBottom: 20,
              }}
            >
              {s.num}
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-fraunces, var(--font-display))',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                lineHeight: 0.9,
                letterSpacing: '-0.05em',
                color: 'var(--ink-strong)',
                fontStyle: 'normal',
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.7,
                color: 'var(--ink-2)',
                marginTop: 20,
                maxWidth: '38ch',
              }}
            >
              {s.body}
            </p>
            <div
              style={{
                marginTop: 28,
                border: '1px solid var(--line-hard)',
                background: 'var(--bg-2)',
                minHeight: 240,
                position: 'relative',
              }}
            >
              {s.visual}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .how-steps { grid-template-columns: 1fr !important; }
          .how-steps > div { border-right: none !important; border-bottom: 1px solid var(--line-hard); }
          .how-steps > div:last-child { border-bottom: none; }
        }
      `}</style>
    </section>
  );
}

/* =========================================================================
   WHO USES IT — 3 cards con sitios reales
   ========================================================================= */
function WhoUsesIt() {
  const cases = [
    {
      url: 'marina-prats.nuweb.app',
      name: 'Marina Prats',
      type: 'ilustradora · barcelona',
      headline: <>Dibujo libros, <em>portadas</em> y errores tipográficos a propósito.</>,
      sub: 'encargos abiertos',
    },
    {
      url: 'altagracia.nuweb.app',
      name: 'Altagracia',
      type: 'cafetería · buenos aires',
      headline: <><em>Café</em> de tueste oscuro, pan de masa madre, mesa larga.</>,
      sub: 'abre 8 — 19',
    },
    {
      url: 'jordiruiz.nuweb.app',
      name: 'Jordi Ruiz',
      type: 'consultor · barcelona',
      headline: <>Ayudo a equipos pequeños a <em>no romperse</em> al crecer.</>,
      sub: 'hablamos · 30 min',
    },
  ];

  return (
    <section
      style={{ padding: '120px 28px', borderTop: '1px solid var(--line-hard)' }}
      id="quienes"
    >
      <SecLabel num="04 / en uso" right="tres webs reales, hechas hablando" />
      <h2
        style={{
          fontFamily: 'var(--font-fraunces, var(--font-display))',
          fontWeight: 300,
          fontSize: 'clamp(2.2rem, 6vw, 5rem)',
          lineHeight: 0.92,
          letterSpacing: '-0.05em',
          color: 'var(--ink-strong)',
          maxWidth: '18ch',
          margin: '24px 0 50px',
        }}
      >
        La gente que ya{' '}
        <em style={{ fontStyle: 'italic', fontWeight: 400 }}>habla</em> con Lúa.
      </h2>

      <div className="who-grid">
        {cases.map((c) => (
          <div
            key={c.name}
            className="who-card"
            style={{
              border: '1px solid var(--line-hard)',
              background: 'var(--bg-2)',
              transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1), box-shadow 0.3s',
            }}
          >
            {/* Mock browser */}
            <div
              style={{
                borderBottom: '1px solid var(--line-hard)',
                aspectRatio: '4 / 3',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--line)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--ink-3)',
                }}
              >
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: 7, height: 7, borderRadius: '50%',
                      border: '1px solid var(--line-hard)',
                    }}
                  />
                ))}
                <span style={{ marginLeft: 8, color: 'var(--ink-2)' }}>{c.url}</span>
              </div>
              <div
                style={{
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 'calc(100% - 33px)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-3)',
                  }}
                >
                  <span>{c.name.toLowerCase()}</span>
                  <span>2026</span>
                </div>
                <h4
                  style={{
                    fontFamily: 'var(--font-fraunces, var(--font-display))',
                    fontWeight: 300,
                    fontSize: 24,
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    color: 'var(--ink-strong)',
                    margin: '12px 0',
                  }}
                >
                  {c.headline}
                </h4>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-3)',
                  }}
                >
                  <span>{c.sub}</span>
                  <span>↘</span>
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--ink-2)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-fraunces, var(--font-display))',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 20,
                  textTransform: 'none',
                  letterSpacing: '-0.02em',
                  color: 'var(--ink-strong)',
                }}
              >
                {c.name}
              </span>
              <span style={{ fontSize: 10 }}>{c.type}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .who-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .who-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
        [data-theme="light"] .who-card:hover {
          box-shadow: 6px 6px 0 var(--ink-strong);
          transform: none;
        }
        @media (max-width: 900px) { .who-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .who-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}

/* =========================================================================
   PRICING
   ========================================================================= */
function Pricing({
  priceDisplay,
  isArgentina,
  trialDays,
}: {
  priceDisplay: string;
  isArgentina: boolean;
  trialDays: number;
}) {
  return (
    <section
      id="precio"
      style={{
        padding: '120px 28px',
        borderTop: '1px solid var(--line-hard)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 0,
        alignItems: 'start',
      }}
      className="price-section"
    >
      <div style={{ gridColumn: 'span 2', paddingRight: 60 }}>
        <SecLabel num="05 / precio" right="catorce días. sin tarjeta." />
        <h2
          style={{
            fontFamily: 'var(--font-fraunces, var(--font-display))',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 5vw, 4.5rem)',
            lineHeight: 0.92,
            letterSpacing: '-0.05em',
            color: 'var(--ink-strong)',
            marginTop: 28,
          }}
        >
          Un precio.{' '}
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Sin asteriscos.</em>
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--ink-2)',
            marginTop: 20,
            maxWidth: '44ch',
          }}
        >
          {trialDays} días gratis. Si después querés seguir, son {priceDisplay} al mes.
          Si no, tu web deja de estar online. No guardamos rehenes.
          {isArgentina && ' Pagás con MercadoPago, en pesos.'}
        </p>
      </div>

      <div />

      {/* Card */}
      <div
        style={{
          border: '1px solid var(--line-hard)',
          background: 'var(--bg-2)',
          padding: 30,
          transform: 'translateY(40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
          }}
        >
          [ plan único ]
        </div>
        <div
          style={{
            fontFamily: 'var(--font-fraunces, var(--font-display))',
            fontWeight: 300,
            fontSize: 80,
            lineHeight: 0.9,
            letterSpacing: '-0.06em',
            color: 'var(--ink-strong)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
          }}
        >
          <sup style={{ fontSize: 20, fontStyle: 'italic', marginTop: 14 }}>
            {isArgentina ? '$' : 'US$'}
          </sup>
          {isArgentina ? '25.000' : '29'}
          <sub
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 400,
              alignSelf: 'flex-end',
              marginBottom: 12,
              color: 'var(--ink-2)',
              letterSpacing: '0.04em',
            }}
          >
            / mes
          </sub>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.9,
            borderTop: '1px solid var(--line)',
            borderBottom: '1px solid var(--line)',
            padding: '12px 0',
          }}
        >
          {[
            'web ilimitada en {nombre}.nuweb.app',
            'conversaciones ilimitadas con Lúa',
            'dominio propio cuando quieras',
            'analítica sin cookies',
            'soporte humano, en castellano',
            'cancelás cuando querés',
          ].map(item => (
            <div key={item} style={{ display: 'flex', gap: 10, color: 'var(--ink)' }}>
              <span style={{ color: 'var(--ink-3)' }}>—</span>
              {item}
            </div>
          ))}
        </div>
        <Link
          href="/login"
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: 14,
            background: 'var(--ink-strong)',
            color: 'var(--bg)',
            textAlign: 'center',
          }}
        >
          empezar {trialDays} días gratis →
        </Link>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'var(--ink-3)',
            textAlign: 'center',
          }}
        >
          sin tarjeta hasta el día {trialDays + 1}
        </div>
      </div>

      <style>{`
        .price-section {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 900px) {
          .price-section {
            grid-template-columns: 1fr 1fr !important;
          }
          .price-section > div:first-child { grid-column: 1; padding-right: 20px; }
          .price-section > div:nth-child(2) { display: none; }
          .price-section > div:last-child { grid-column: 2; transform: none; }
        }
        @media (max-width: 560px) {
          .price-section { grid-template-columns: 1fr !important; }
          .price-section > div:first-child { grid-column: 1; padding-right: 0; }
          .price-section > div:last-child { grid-column: 1; transform: none; margin-top: 20px; }
        }
      `}</style>
    </section>
  );
}

/* =========================================================================
   FINAL CTA
   ========================================================================= */
function FinalCTA({ trialDays }: { trialDays: number }) {
  return (
    <section
      style={{
        padding: '160px 28px 80px',
        borderTop: '1px solid var(--line-hard)',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-fraunces, var(--font-display))',
          fontWeight: 300,
          fontSize: 'clamp(4rem, 16vw, 16rem)',
          lineHeight: 0.82,
          letterSpacing: '-0.06em',
          color: 'var(--ink-strong)',
        }}
      >
        Empezá.
        <br />
        <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Hablá.</em>
      </h2>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 60,
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '18px 26px',
            background: 'var(--ink-strong)',
            color: 'var(--bg)',
          }}
        >
          crear mi sitio gratis →
        </Link>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-2)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            maxWidth: '34ch',
            lineHeight: 1.7,
          }}
        >
          {trialDays} días de prueba. Después, podés cancelar en cualquier momento.
          Tu web, siempre tuya.
        </p>
      </div>
    </section>
  );
}

/* =========================================================================
   Helpers
   ========================================================================= */
function SecLabel({ num, right }: { num: string; right: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderTop: '1px solid var(--line-hard)',
        padding: '12px 0',
        color: 'var(--ink-strong)',
      }}
    >
      <span>[ {num} ]</span>
      <span style={{ color: 'var(--ink-2)' }}>{right}</span>
    </div>
  );
}

function BentoCell({
  className,
  tag,
  children,
  accent,
  inverted,
}: {
  className: string;
  tag: string;
  children: React.ReactNode;
  accent?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className={`bento-cell ${className} ${inverted ? 'inverted' : ''} ${accent ? 'bento-accent' : ''}`}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: inverted ? 'rgba(17,17,17,0.6)' : 'var(--ink-2)',
        }}
      >
        {tag}
      </div>
      {children}
    </div>
  );
}
