'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/db';

/**
 * Cliente de Supabase para Client Components.
 *
 * Solo usa la anon key — la service_role key NUNCA debe llegar al navegador.
 * Verifica security_auditor.md.
 */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
