import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="text-center">
        <p className="font-mono text-sm text-ink-mute">404</p>
        <h1 className="mt-4 font-display text-5xl leading-display tracking-display text-ink-strong md:text-6xl">
          Aquí no hay nada.
        </h1>
        <p className="mt-4 text-ink-mute">
          La página que buscas no existe o se ha movido.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-sm bg-ink-strong px-5 py-3 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.98]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
