import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { publishSiteSnapshot } from '@/lib/publishing/snapshot';
import { publishLimiter } from '@/lib/ratelimit';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/builder/publish
 *
 * Publica el sitio del usuario. Alternativa al flujo conversacional:
 * el botón "Publicar" en la UI llama aquí directamente sin invocar al
 * agente — más rápido y sin coste de modelo.
 *
 * Body: { siteId }
 */

export const runtime = 'nodejs';

const requestSchema = z.object({
  siteId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'siteId requerido' }, { status: 400 });
  }

  // Rate limit: 5 publishes/hora (definido en lib/ratelimit.ts)
  const limit = await publishLimiter.limit(user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Has publicado muchas veces seguidas. Espera unos minutos.' },
      { status: 429 }
    );
  }

  // Ownership
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('id', parsed.data.siteId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!site) {
    return NextResponse.json({ error: 'Sitio no encontrado' }, { status: 404 });
  }

  const result = await publishSiteSnapshot(parsed.data.siteId, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    url: result.url,
    version: result.version,
  });
}
