import Link from 'next/link';

interface CheckEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const { email } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-4xl leading-display tracking-display text-ink-strong md:text-5xl">
        Revisa tu email
      </h1>
      <p className="mt-4 text-ink-mute">
        {email ? (
          <>
            Te hemos enviado un enlace a{' '}
            <span className="font-mono text-ink-strong">{email}</span>. Cliquéalo
            para entrar.
          </>
        ) : (
          <>Te hemos enviado un enlace para entrar.</>
        )}
      </p>
      <p className="mt-2 text-sm text-ink-mute">
        Si no aparece en un par de minutos, mira en spam o vuelve a pedirlo.
      </p>

      <Link
        href="/login"
        className="mt-10 inline-block text-sm text-ink-mute hover:text-ink-strong"
      >
        ← Volver
      </Link>
    </div>
  );
}
