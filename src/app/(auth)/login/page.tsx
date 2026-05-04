import { GoogleSignInButton } from '@/app/(auth)/login/_google-button';
import { MagicLinkForm } from '@/app/(auth)/login/_form';

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

/**
 * Página de login — dos métodos:
 *   1. Google OAuth (un clic, menos fricción)
 *   2. Magic link (para quienes no usan Google o prefieren email)
 *
 * Google va primero porque es el camino más rápido para nuestro usuario
 * objetivo (freelancers, creadores — la mayoría tiene cuenta de Google).
 * Magic link queda como alternativa sin password.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-4xl leading-display tracking-display text-ink-strong md:text-5xl">
        Entrá a nuweb
      </h1>
      <p className="mt-4 text-ink-mute">
        Creá tu cuenta o iniciá sesión. No necesitás contraseña.
      </p>

      {params.error === 'auth' && (
        <p className="mt-6 rounded-sm border border-accent-red-bg bg-accent-red-bg/40 px-4 py-3 text-sm text-accent-red-fg">
          El enlace expiró o no es válido. Intentá de nuevo.
        </p>
      )}

      {/* Google OAuth — método principal */}
      <div className="mt-10">
        <GoogleSignInButton next={params.next ?? '/dashboard'} />
      </div>

      {/* Separador */}
      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-canvas px-4 text-xs uppercase tracking-[0.06em] text-ink-faint">
            o con tu email
          </span>
        </div>
      </div>

      {/* Magic link — método alternativo */}
      <MagicLinkForm next={params.next ?? '/dashboard'} />

      <p className="mt-10 text-xs text-ink-mute">
        Al continuar aceptás los{' '}
        <a
          href="/terms"
          className="underline underline-offset-2 hover:text-ink-strong"
        >
          Términos
        </a>{' '}
        y la{' '}
        <a
          href="/privacy"
          className="underline underline-offset-2 hover:text-ink-strong"
        >
          Política de privacidad
        </a>
        .
      </p>
    </div>
  );
}
