'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { authLimiter } from '@/lib/ratelimit';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Server Actions del flujo de auth.
 *
 * Dos métodos de login:
 *   1. Magic link (email) — sin contraseña
 *   2. Google OAuth — un clic, sin fricciones
 *
 * Ambos crean cuenta automáticamente si el usuario es nuevo.
 * El callback en /auth/callback maneja ambos flujos.
 */

export type MagicLinkState =
  | { ok: true; email: string }
  | { ok: false; error: string };

const schema = z.object({
  email: z.string().email('Introduce un email válido.'),
  hp: z.string().optional(),
});

export async function sendMagicLink(
  _previous: MagicLinkState | null,
  formData: FormData
): Promise<MagicLinkState> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    hp: formData.get('hp'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Email inválido.' };
  }
  const { email, hp } = parsed.data;

  if (hp && hp.length > 0) {
    return { ok: true, email };
  }

  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown';
  const limit = await authLimiter.limit(ip);
  if (!limit.success) {
    return {
      ok: false,
      error: 'Has pedido demasiados enlaces seguidos. Espera unos minutos antes de intentarlo de nuevo.',
    };
  }

  const supabase = await createServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const next = (formData.get('next') as string | null) ?? '/dashboard';
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  const { error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error) {
    console.error('[auth] signInWithOtp falló:', error);
    return {
      ok: false,
      error: 'No pudimos enviar el enlace. Inténtalo de nuevo en un momento.',
    };
  }

  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

/** Cierra la sesión del usuario. */
export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
