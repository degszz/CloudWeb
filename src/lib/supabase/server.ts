import { createServerClient as createSSR } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/db';

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Usa la cookie de sesión del usuario autenticado. Respeta RLS.
 * NO uses esto para operaciones que requieran service_role.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSR<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components no pueden modificar cookies. Lo ignoramos —
            // el middleware refresca la sesión en cada request.
          }
        },
      },
    }
  );
}
