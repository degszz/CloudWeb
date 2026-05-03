import { NextResponse, type NextRequest } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';

/**
 * Callback de auth — maneja tanto magic link como Google OAuth.
 *
 * Ambos flujos (OTP y OAuth PKCE) envían un `code` que intercambiamos
 * por una sesión con exchangeCodeForSession(). Un solo callback para todo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Solo permitimos redirects relativos para evitar open redirect
      const safeNext = next.startsWith('/') ? next : '/dashboard';
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
