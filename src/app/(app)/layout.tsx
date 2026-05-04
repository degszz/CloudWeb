import Link from 'next/link';
import { redirect } from 'next/navigation';

import { signOut } from '@/app/(auth)/actions';
import { Icon } from '@/components/ui/icon';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Layout del área autenticada.
 *
 * El middleware ya redirige a /login si no hay user, pero hacemos check
 * defensivo aquí también (defense in depth). Usamos el patrón de cargar
 * profile + suscripción una sola vez y dejarlo en el árbol React via
 * Server Components — los hijos pueden re-fetch si quieren detalles.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Cargar profile y subscripción para gating discreto en el header
  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase
      .from('profiles')
      .select('email, full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('status, current_period_end, trial_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const isTrialing = sub?.status === 'trialing';
  const trialEndsAt = sub?.trial_end ? new Date(sub.trial_end) : null;
  const trialDaysLeft =
    trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-canvas items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="font-display text-2xl tracking-display text-ink-strong"
          >
            nuweb
          </Link>

          <div className="flex items-center gap-5 text-sm text-ink-mute">
            {isTrialing && trialDaysLeft !== null && (
              <span className="hidden rounded-pill bg-accent-yellow-bg px-3 py-1 text-xs uppercase tracking-caps text-accent-yellow-fg md:inline-flex">
                Prueba · {trialDaysLeft} días
              </span>
            )}
            <Link href="/settings" className="hover:text-ink-strong">
              Ajustes
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 hover:text-ink-strong"
                title={profile?.email ?? user.email ?? ''}
              >
                {profile?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-6 w-6 rounded-pill object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Icon name="user" size={16} />
                )}
                <span className="hidden md:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
