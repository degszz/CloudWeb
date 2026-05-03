/**
 * Tipos de la base de datos Supabase.
 *
 * Este archivo se regenera automáticamente con:
 *
 *   npm run db:types
 *
 * (que ejecuta `supabase gen types typescript --local > src/types/db.ts`)
 *
 * El stub vacío de aquí permite que el scaffolding compile antes de
 * aplicar las migraciones. Sustitúyelo en cuanto las migraciones
 * estén corriendo en local.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
