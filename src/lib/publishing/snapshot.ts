import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { siteContentSchema } from '@/lib/builder/schema';

/**
 * Crea un snapshot inmutable del content_json actual del site y marca el
 * site como publicado en la versión correspondiente.
 *
 * Es una transacción lógica de 3 pasos:
 *   1. Validar el content_json contra el schema (no publicamos JSON roto)
 *   2. Insertar publication con la versión actual
 *   3. Actualizar sites con last_published_at + last_published_version + is_published=true
 *
 * Si cualquiera falla, abortamos (idealmente con rollback). En MVP no usamos
 * transacciones explícitas — Supabase JS client no las soporta directamente
 * y para el flujo crítico (3 escrituras) la probabilidad de fallo parcial
 * es baja. Si pasa, el cron de reconciliación (post-MVP) lo arreglaría.
 */

export type PublishResult =
  | { ok: true; publicationId: string; version: number; slug: string; url: string }
  | { ok: false; error: string };

export async function publishSiteSnapshot(
  siteId: string,
  userId: string
): Promise<PublishResult> {
  const supabase = createAdminClient();

  // 1. Cargar site actual
  const { data: site, error: readErr } = await supabase
    .from('sites')
    .select('id, slug, name, description, content_json, content_version')
    .eq('id', siteId)
    .eq('user_id', userId)
    .single();

  if (readErr || !site) {
    return { ok: false, error: 'No se pudo leer el sitio.' };
  }

  // 2. Validar contenido
  const parsed = siteContentSchema.safeParse(site.content_json);
  if (!parsed.success) {
    return {
      ok: false,
      error: `El contenido del sitio tiene errores: ${parsed.error.errors[0]?.message ?? 'desconocido'}. Corrige antes de publicar.`,
    };
  }

  const page = parsed.data.pages[0];
  if (!page || page.sections.length === 0) {
    return {
      ok: false,
      error: 'Tu sitio no tiene secciones todavía. Añade al menos una antes de publicar.',
    };
  }

  // 3. Insertar publication
  const { data: pub, error: pubErr } = await supabase
    .from('publications')
    .insert({
      site_id: site.id,
      user_id: userId,
      version: site.content_version,
      content_snapshot: site.content_json,
      published_title: page.metadata.title || site.name,
      published_description: page.metadata.description || site.description,
      published_slug: site.slug,
    })
    .select('id, version')
    .single();

  if (pubErr || !pub) {
    return { ok: false, error: `No se pudo crear el snapshot: ${pubErr?.message ?? 'error desconocido'}` };
  }

  // 4. Marcar site como publicado
  const { error: updErr } = await supabase
    .from('sites')
    .update({
      is_published: true,
      last_published_at: new Date().toISOString(),
      last_published_version: pub.version,
    })
    .eq('id', site.id);

  if (updErr) {
    return { ok: false, error: `Snapshot creado pero no se pudo marcar como publicado: ${updErr.message}` };
  }

  // Construir URL pública
  const domain = process.env.NEXT_PUBLIC_PUBLISH_DOMAIN ?? 'localhost:3000';
  const protocol = domain.startsWith('localhost') ? 'http' : 'https';
  const url = `${protocol}://${site.slug}.${domain}`;

  // Email de confirmación al usuario (best-effort, no bloqueante)
  notifyUserOfPublication(userId, site.name, url).catch((err) =>
    console.error('[publish] no se pudo enviar email de confirmación:', err)
  );

  return { ok: true, publicationId: pub.id, version: pub.version, slug: site.slug, url };
}

async function notifyUserOfPublication(
  userId: string,
  siteName: string,
  publicUrl: string
): Promise<void> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
  if (!profile?.email) return;

  const { resend, FROM_EMAIL } = await import('@/lib/email/resend');
  const { SitePublishedEmail } = await import('@/lib/email/templates/site-published');
  await resend.emails.send({
    from: FROM_EMAIL,
    to: profile.email,
    subject: `${siteName} ya está publicado`,
    react: SitePublishedEmail({ siteName, publicUrl }),
  });
}
