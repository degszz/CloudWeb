import Link from 'next/link';

import { signOut } from '@/app/(auth)/actions';
import { Icon } from '@/components/ui/icon';
import { createServerClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase
      .from('profiles')
      .select('email, full_name, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('status, current_period_end, trial_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-editorial px-6 py-16 md:py-24">
      <p className="text-xs uppercase tracking-caps text-ink-mute">Tu cuenta</p>
      <h1 className="mt-4 font-display text-5xl leading-display tracking-display text-ink-strong">
        Ajustes
      </h1>

      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-display text-ink-strong">
          Perfil
        </h2>
        <dl className="mt-6 divide-y divide-line border-t border-line">
          <Row label="Email" value={profile?.email ?? user.email ?? ''} />
          {profile?.full_name && <Row label="Nombre" value={profile.full_name} />}
          <Row
            label="Miembro desde"
            value={
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'
            }
          />
        </dl>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl tracking-display text-ink-strong">
          Suscripción
        </h2>
        <dl className="mt-6 divide-y divide-line border-t border-line">
          <Row
            label="Estado"
            value={subStatusLabel(sub?.status ?? null)}
          />
          {sub?.status === 'trialing' && sub.trial_end && (
            <Row
              label="Fin del trial"
              value={new Date(sub.trial_end).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
              })}
            />
          )}
          {sub?.status === 'active' && sub.current_period_end && (
            <Row
              label="Próximo cobro"
              value={new Date(sub.current_period_end).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
              })}
            />
          )}
          {sub?.cancel_at_period_end && (
            <Row label="Cancelación" value="Al final del periodo actual" />
          )}
        </dl>

        <div className="mt-8">
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-4 py-2.5 text-sm text-ink-strong transition-colors hover:bg-surface-bone"
          >
            Gestionar pagos y facturación
            <Icon name="arrow-up-right" size={14} />
          </Link>
        </div>
      </section>

      <section className="mt-16 border-t border-line pt-8">
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-ink-mute hover:text-ink-strong"
          >
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 md:flex-row md:items-center md:justify-between">
      <dt className="text-sm uppercase tracking-caps text-ink-mute">{label}</dt>
      <dd className="text-base text-ink">{value}</dd>
    </div>
  );
}

function subStatusLabel(status: string | null): string {
  switch (status) {
    case 'trialing':
      return 'En periodo de prueba';
    case 'active':
      return 'Activa';
    case 'canceled':
      return 'Cancelada';
    case 'past_due':
      return 'Pago pendiente';
    case null:
      return 'Sin suscripción';
    default:
      return status;
  }
}
