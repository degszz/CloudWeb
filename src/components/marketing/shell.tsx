import Link from 'next/link';

/**
 * Shell de marketing con header + footer nuweb.
 *
 * Lo usan las páginas interiores (pricing, terms, privacy, cookies).
 * La landing tiene su propio nav/footer B&W, así que NO usa esto.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-canvas items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-display text-2xl tracking-display text-ink-strong"
          >
            nuweb
          </Link>
          <nav className="flex items-center gap-6 text-sm text-ink-mute">
            <Link href="/pricing" className="hover:text-ink-strong">
              Precio
            </Link>
            <Link
              href="/login"
              className="rounded-sm bg-ink-strong px-4 py-2 text-canvas-pure transition-colors hover:bg-[#333333]"
            >
              Empezar
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-canvas flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-ink-mute md:flex-row md:items-center">
          <p>nuweb · Hecho con cuidado.</p>
          <div className="flex gap-6">
            <Link href="/terms">Términos</Link>
            <Link href="/privacy">Privacidad</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
