import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware único que hace dos cosas:
 *
 *  1. Subdomain rewriting: cafe-lua.cloudweb.app/* → /(public)/cafe-lua/*
 *     Esto permite servir todos los sitios publicados desde el mismo
 *     deployment de Vercel, sin generar deploys por sitio.
 *
 *  2. Auth gate: refresca la cookie Supabase y redirige a /login
 *     las rutas /dashboard, /builder/*, /settings/*.
 */

const PUBLISH_DOMAIN = process.env.NEXT_PUBLIC_PUBLISH_DOMAIN ?? 'localhost:3000';

const PROTECTED_PREFIXES = ['/dashboard', '/builder', '/settings'];

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const url = request.nextUrl.clone();

  // === 1. Subdomain rewriting ===
  // Si el host es {slug}.{PUBLISH_DOMAIN}, reescribe a /(public)/[slug]
  if (host.endsWith(`.${PUBLISH_DOMAIN}`) && host !== PUBLISH_DOMAIN) {
    const slug = host.slice(0, host.length - PUBLISH_DOMAIN.length - 1);
    // Evita bucles: si ya estamos en /(public)/<slug>, no reescribimos
    if (!url.pathname.startsWith(`/${slug}`)) {
      url.pathname = `/${slug}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // === 2. Auth en rutas protegidas ===
  const { response, user } = await updateSession(request);
  const needsAuth = PROTECTED_PREFIXES.some((p) =>
    url.pathname.startsWith(p)
  );
  if (needsAuth && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match a todo excepto:
     * - api routes (manejan su propia auth si la necesitan)
     * - assets estáticos (_next/static, _next/image, public)
     * - favicon e iconos
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
