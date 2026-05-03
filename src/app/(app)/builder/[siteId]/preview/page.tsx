import { notFound } from 'next/navigation';

import { renderSite } from '@/lib/builder/render';
import { createServerClient } from '@/lib/supabase/server';

interface PreviewPageProps {
  params: Promise<{ siteId: string }>;
}

/**
 * Vista previa del borrador.
 *
 * Diferencias críticas con el render público (/[slug]):
 *   - Lee sites.content_json (borrador), no publications.content_snapshot
 *   - Usa el cliente con sesión del usuario (RLS valida ownership)
 *   - Sin caché — debe reflejar cambios del agente al instante
 *
 * Mismo renderer que el sitio publicado: paridad garantizada.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { siteId } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: site } = await supabase
    .from('sites')
    .select('content_json')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!site) notFound();

  const result = renderSite(site.content_json);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-editorial px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-caps text-ink-mute">Vista previa</p>
        <h1 className="mt-3 font-display text-3xl tracking-display text-ink-strong">
          Hay un problema en el contenido del sitio.
        </h1>
        <p className="mt-3 text-ink-mute">
          Pídele a Lúa que vuelva a montar la sección que estabas editando.
        </p>
      </div>
    );
  }

  if (!result.tree) {
    return <EmptyPreview />;
  }

  return result.tree;
}

function EmptyPreview() {
  return (
    <div className="mx-auto max-w-editorial px-6 py-32 text-center">
      <p className="text-xs uppercase tracking-caps text-ink-mute">Vista previa</p>
      <h1 className="mt-4 font-display text-5xl leading-display tracking-display text-ink-strong md:text-6xl">
        Tu sitio está en blanco.
      </h1>
      <p className="mt-6 text-ink-mute">
        Cuéntale a Lúa de qué va tu proyecto y empezará a montar las primeras secciones.
      </p>
    </div>
  );
}
