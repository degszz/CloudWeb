import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { renderSite } from '@/lib/builder/render';
import { createAdminClient } from '@/lib/supabase/admin';

interface PublicSitePageProps {
  // El middleware reescribe {slug}.cloudweb.app a /(public)/[slug]
  // El [slug] es el primer segmento; el resto se ignora en MVP (1 página).
  params: Promise<{ slug: string }>;
}

/**
 * Render público de un sitio publicado.
 *
 * Lee con service_role (la tabla publications no permite lectura anónima
 * via RLS — es write-only para autenticados). El filtro is_published=true
 * está implícito en la función SQL get_published_site_by_slug.
 *
 * Cache: revalidate cada 60s. Cuando el usuario re-publica, podemos
 * invalidar manualmente con revalidatePath en el snapshot.ts (mejora
 * post-MVP — ahora el TTL de 60s es suficiente).
 */
export const revalidate = 60;

async function fetchPublishedSite(slug: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc('get_published_site_by_slug', { target_slug: slug })
    .single();
  if (error) return null;
  return data;
}

export async function generateMetadata({
  params,
}: PublicSitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await fetchPublishedSite(slug);
  if (!site) return { title: 'No encontrado' };
  return {
    title: site.title,
    description: site.description ?? undefined,
    openGraph: {
      title: site.title,
      description: site.description ?? undefined,
      type: 'website',
    },
  };
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const { slug } = await params;
  const site = await fetchPublishedSite(slug);
  if (!site) notFound();

  const result = renderSite(site.content);
  if (!result.ok || !result.tree) {
    // Si por algún motivo el snapshot está roto, mostramos algo decente
    // en lugar de notFound (es un sitio publicado, debería verse).
    return (
      <main className="mx-auto max-w-editorial px-6 py-32 text-center">
        <h1 className="font-display text-4xl tracking-display text-ink-strong">
          {site.title}
        </h1>
        {site.description && (
          <p className="mt-4 text-ink-mute">{site.description}</p>
        )}
      </main>
    );
  }

  return result.tree;
}
