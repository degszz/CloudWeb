import Link from 'next/link';

import { Icon } from '@/components/ui/icon';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-canvas items-center justify-between px-5 py-4 md:px-10">
          <Link
            href="/"
            className="font-display text-[22px] tracking-display text-ink-strong"
          >
            CloudWeb
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="#precio"
              className="hidden text-sm text-ink-mute transition-colors hover:text-ink-strong md:inline"
            >
              Precio
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-sm bg-ink-strong px-4 py-2 text-[13px] text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.97]"
            >
              Empezar gratis
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-canvas flex-col items-center gap-3 px-5 py-6 text-[13px] text-ink-faint md:flex-row md:justify-between md:px-10">
          <p>© 2026 CloudWeb</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-ink-strong">Términos</Link>
            <Link href="/privacy" className="hover:text-ink-strong">Privacidad</Link>
            <a href="mailto:hola@cloudweb.app" className="hover:text-ink-strong">hola@cloudweb.app</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
