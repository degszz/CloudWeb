'use server';

import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';
import { getTemplate } from '@/templates';
import type { Json } from '@/types/db';

/**
 * Crea un sitio nuevo para el usuario actual.
 *
 * En MVP enforced single-site con UNIQUE index — si ya tiene uno, redirige
 * al builder existente en lugar de fallar.
 *
 * Slug temporal: 'mi-sitio-' + 6 caracteres aleatorios. El usuario puede
 * cambiarlo desde el chat ("cambia el subdominio a mi-cafe").
 */
export async function createSiteAction(): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Si ya tiene un sitio (single-site MVP), redirige al builder
  const { data: existing } = await supabase
    .from('sites')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/builder/${existing.id}`);
  }

  const slug = generateTempSlug();
  const blank = getTemplate('blank');

  const { data: created, error } = await supabase
    .from('sites')
    .insert({
      user_id: user.id,
      slug,
      name: 'Mi sitio',
      content_json: blank as unknown as Json,
      content_version: 1,
    })
    .select('id')
    .single();

  if (error || !created) {
    // Si choca el slug por azar, reintenta UNA vez con otro slug
    const fallbackSlug = generateTempSlug();
    const retry = await supabase
      .from('sites')
      .insert({
        user_id: user.id,
        slug: fallbackSlug,
        name: 'Mi sitio',
        content_json: blank as unknown as Json,
        content_version: 1,
      })
      .select('id')
      .single();
    if (retry.error || !retry.data) {
      throw new Error(`No se pudo crear el sitio: ${retry.error?.message ?? 'error desconocido'}`);
    }
    redirect(`/builder/${retry.data.id}`);
  }

  redirect(`/builder/${created.id}`);
}

function generateTempSlug(): string {
  const adjectives = ['nuevo', 'lindo', 'fresco', 'claro', 'limpio'];
  const nouns = ['sitio', 'lugar', 'espacio', 'rincon', 'taller'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${adj}-${noun}-${suffix}`;
}
