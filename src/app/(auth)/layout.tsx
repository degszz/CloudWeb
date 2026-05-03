import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="px-6 py-5">
        <Link
          href="/"
          className="font-display text-2xl tracking-display text-ink-strong"
        >
          CloudWeb
        </Link>
      </header>
      <main className="mx-auto max-w-md px-6 py-16">{children}</main>
    </div>
  );
}
