import Link from 'next/link';

import { createSiteAction } from '@/app/(app)/actions';
import { Icon } from '@/components/ui/icon';
import { createServerClient } from '@/lib/supabase/server';
import { getPublishedUrl } from '@/lib/utils';

/**
 * Dashboard: punto de entrada al área autenticada.
 *
 * Single-site MVP: el usuario tiene 0 o 1 sitio.
 *   - 0 sitios: hero con CTA "Crear mi sitio" (botón con Server Action)
 *   - 1 sitio: card con nombre, estado, slug y dos accesos (builder + público)
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Layout ya hizo redirect, pero TS no lo sabe
  if (!user) return null;

  const { data: site } = await supabase
    .from('sites')
    .select('id, slug, name, description, is_published, last_published_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-canvas px-6 py-16 md:py-24">
      {!site ? (
        <EmptyState />
      ) : (
        <SiteCard site={site} />
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="max-w-editorial">
      <p className="text-xs uppercase tracking-caps text-ink-mute">
        Tu cuenta
      </p>
      <h1 className="mt-4 font-display text-5xl leading-display tracking-display text-ink-strong md:text-6xl">
        Vamos a montar tu sitio.
      </h1>
      <p className="mt-6 max-w-prose text-lg text-ink">
        Cuando empieces, Lúa te preguntará de qué va tu proyecto y montará una
        primera versión contigo en menos de cinco minutos. Lo ajustas hablando.
      </p>

      <form action={createSiteAction} className="mt-10">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-sm bg-ink-strong px-5 py-3 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.98]"
        >
          Crear mi sitio
          <Icon name="arrow-right" size={16} />
        </button>
      </form>
    </div>
  );
}

interface SiteSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_published: boolean;
  last_published_at: string | null;
  updated_at: string;
}

function SiteCard({ site }: { site: SiteSummary }) {
  const publishedUrl = getPublishedUrl(site.slug);
  const lastEdit = formatRelative(new Date(site.updated_at));

  return (
    <div className="max-w-editorial">
      <p className="text-xs uppercase tracking-caps text-ink-mute">
        Tu sitio
      </p>
      <h1 className="mt-4 font-display text-5xl leading-display tracking-display text-ink-strong">
        {site.name}
      </h1>
      {site.description && (
        <p className="mt-3 max-w-prose text-base text-ink-mute">
          {site.description}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-4 rounded-lg border border-line bg-surface p-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-mono text-ink">{site.slug}.cloudweb.app</span>
          {site.is_published ? (
            <span className="rounded-pill bg-accent-green-bg px-3 py-0.5 text-xs uppercase tracking-caps text-accent-green-fg">
              Publicado
            </span>
          ) : (
            <span className="rounded-pill bg-surface-bone px-3 py-0.5 text-xs uppercase tracking-caps text-ink-mute">
              Borrador
            </span>
          )}
        </div>

        <p className="text-sm text-ink-mute">
          Última edición {lastEdit}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            href={`/builder/${site.id}`}
            className="inline-flex items-center gap-2 rounded-sm bg-ink-strong px-4 py-2.5 text-sm text-canvas-pure transition-all duration-200 hover:bg-[#333333] active:scale-[0.98]"
          >
            Abrir builder
            <Icon name="arrow-right" size={16} />
          </Link>

          {site.is_published && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink-strong"
            >
              Ver en vivo
              <Icon name="arrow-up-right" size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** Formatea una fecha como "hace X días" / "hoy" / "ayer". */
function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays < 1) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}
