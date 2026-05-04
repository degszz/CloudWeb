import Link from 'next/link';

import { CustomCursorLazy as CustomCursor } from '@/components/landing/cursor-lazy';
import { ThemeToggleLazy as ThemeToggle } from '@/components/landing/theme-toggle-lazy';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <CustomCursor />

      {/* Nav */}
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 28px',
          mixBlendMode: 'difference',
          color: '#fff',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          {/* Dark theme logo (shown via CSS) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-dark.avif"
            alt="nuweb"
            className="nav-logo nav-logo-dark"
            style={{ height: 28, width: 'auto' }}
          />
          {/* Light theme logo (shown via CSS) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-light.avif"
            alt="nuweb"
            className="nav-logo nav-logo-light"
            style={{ height: 28, width: 'auto' }}
          />
        </Link>

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'flex',
            gap: 28,
            alignItems: 'center',
            color: 'inherit',
          }}
        >
          <Link href="#demo" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}
            className="nav-link">demo</Link>
          <Link href="#como" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}
            className="nav-link">cómo</Link>
          <Link href="#precio" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}
            className="nav-link">precio</Link>
          <ThemeToggle />
          <Link
            href="/login"
            style={{
              border: '1px solid currentColor',
              padding: '8px 14px',
              color: 'inherit',
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
            className="nav-cta"
          >
            empezar →
          </Link>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--line-hard)',
          padding: '22px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span style={{ color: 'var(--ink-strong)' }}>nuweb © 2026</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</Link>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</Link>
          <Link href="/cookies" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</Link>
          <a href="mailto:hola@nuweb.app" style={{ color: 'inherit', textDecoration: 'none' }}>
            hola@nuweb.app
          </a>
        </div>
      </footer>

      <style>{`
        /* Logo visibility — nav uses mix-blend-mode: difference so both logos
           are always "white" visually. We swap which file shows based on theme
           so the correct artwork appears when blend is removed (e.g. mobile). */
        .nav-logo-light { display: none; }
        .nav-logo-dark  { display: block; }
        [data-theme="light"] .nav-logo-light { display: block; }
        [data-theme="light"] .nav-logo-dark  { display: none; }

        .nav-link:hover { opacity: 1 !important; }
        .nav-cta:hover { background: #fff; color: #000 !important; }
        @media (max-width: 768px) {
          .nav-link { display: none !important; }
        }
      `}</style>
    </div>
  );
}
