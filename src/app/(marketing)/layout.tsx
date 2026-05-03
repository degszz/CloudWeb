import Link from 'next/link';

import { CustomCursorLazy as CustomCursor } from '@/components/landing/cursor-lazy';
import { ThemeToggle } from '@/components/landing/theme-toggle';

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
            fontFamily: 'var(--font-fraunces, var(--font-display))',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: '-0.05em',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          cloud<em style={{ fontStyle: 'italic', fontWeight: 300 }}>web</em>
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

      {/* Theme toggle — top right corner, below nav blend */}
      <div
        style={{
          position: 'fixed',
          top: 20, right: 28,
          zIndex: 49,
        }}
      >
        <ThemeToggle />
      </div>

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
        <span style={{ color: 'var(--ink-strong)' }}>CloudWeb © 2026</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</Link>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</Link>
          <Link href="/cookies" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</Link>
          <a href="mailto:hola@cloudweb.app" style={{ color: 'inherit', textDecoration: 'none' }}>
            hola@cloudweb.app
          </a>
        </div>
      </footer>

      <style>{`
        .nav-link:hover { opacity: 1 !important; }
        .nav-cta:hover { background: #fff; color: #000 !important; }
        @media (max-width: 768px) {
          .nav-link { display: none; }
        }
      `}</style>
    </div>
  );
}
