'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Sección de scroll inmersivo — una nube de partículas CSS que se transforma
 * a medida que el usuario hace scroll, creando una experiencia de inmersión.
 *
 * Usa Intersection Observer + scroll position para interpolar valores.
 */
export function CloudScroll() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    function onScroll() {
      const rect = section!.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 when section enters bottom, 1 when it exits top
      const raw = 1 - (rect.top + rect.height) / (vh + rect.height);
      setProgress(Math.max(0, Math.min(1, raw)));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Interpolated values
  const scale = 0.3 + progress * 2.5;
  const opacity = progress < 0.15 ? progress / 0.15 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
  const blur = progress < 0.3 ? (1 - progress / 0.3) * 8 : progress > 0.7 ? ((progress - 0.7) / 0.3) * 12 : 0;
  const yShift = (1 - progress) * 60 - 30;
  const rotateZ = progress * 15 - 7.5;

  // Generate cloud dots deterministically
  const dots = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      x: 50 + (Math.sin(i * 2.39996) * 30 + Math.cos(i * 1.7) * 15) * (0.5 + (i % 3) * 0.25),
      y: 50 + (Math.cos(i * 2.39996) * 18 + Math.sin(i * 3.1) * 10) * (0.5 + (i % 4) * 0.2),
      size: 3 + (i % 5) * 2 + Math.sin(i) * 2,
      delay: (i % 8) * 0.15,
    }))
  ).current;

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '200vh',
        overflow: 'hidden',
      }}
    >
      {/* Sticky container */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Cloud particle formation */}
        <div
          style={{
            position: 'relative',
            width: '60vw',
            height: '40vh',
            transform: `scale(${scale}) translateY(${yShift}px) rotate(${rotateZ}deg)`,
            opacity: opacity,
            filter: `blur(${blur}px)`,
            transition: 'transform 0.1s ease-out, opacity 0.1s, filter 0.1s',
          }}
        >
          {dots.map((dot, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: dot.size,
                height: dot.size,
                borderRadius: '50%',
                background: 'var(--ink-strong)',
                opacity: 0.15 + (progress * 0.4),
                transform: `scale(${1 + Math.sin(progress * Math.PI + dot.delay * 3) * 0.5})`,
              }}
            />
          ))}
        </div>

        {/* Text overlay — fades in at different scroll points */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {/* Phase 1: "Imagina" */}
          <span
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(2rem, 6vw, 5rem)',
              fontStyle: 'italic',
              letterSpacing: '-0.04em',
              color: 'var(--ink-strong)',
              opacity: progress > 0.1 && progress < 0.35 ? (progress < 0.2 ? (progress - 0.1) / 0.1 : (0.35 - progress) / 0.15) : 0,
              transform: `translateY(${progress < 0.2 ? 20 : 0}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            Imaginá.
          </span>

          {/* Phase 2: "Habla" */}
          <span
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 300,
              fontSize: 'clamp(2.5rem, 8vw, 7rem)',
              letterSpacing: '-0.05em',
              color: 'var(--ink-strong)',
              opacity: progress > 0.35 && progress < 0.6 ? (progress < 0.42 ? (progress - 0.35) / 0.07 : (0.6 - progress) / 0.18) : 0,
              transform: `translateY(${progress < 0.42 ? 30 : 0}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            Hablá.
          </span>

          {/* Phase 3: "Publica" */}
          <span
            style={{
              fontFamily: 'var(--font-fraunces, var(--font-display))',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: 'clamp(3rem, 10vw, 9rem)',
              letterSpacing: '-0.06em',
              color: 'var(--ink-strong)',
              opacity: progress > 0.6 && progress < 0.95 ? (progress < 0.68 ? (progress - 0.6) / 0.08 : (0.95 - progress) / 0.27) : 0,
              transform: `scale(${progress > 0.68 ? 1 : 0.9})`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            Publicá.
          </span>
        </div>

        {/* Scroll indicator */}
        {progress < 0.15 && (
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              opacity: 1 - progress * 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{
              width: 1, height: 30,
              background: 'var(--ink-3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'block',
            }}>
              <span style={{
                position: 'absolute', top: '-100%', left: 0,
                width: '100%', height: '100%',
                background: 'var(--ink)',
                animation: 'cw-slide 2s infinite',
              }} />
            </span>
            scroll
          </div>
        )}
      </div>
    </section>
  );
}
