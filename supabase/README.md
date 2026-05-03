# CloudWeb — Database Schema

Este directorio contiene las migraciones SQL del proyecto.

## Mapa de migraciones

| Archivo | Crea |
|---|---|
| `0001_init.sql` | `profiles` + trigger `handle_new_user` + extensiones |
| `0002_subscriptions.sql` | `subscription_status` enum + `subscriptions` |
| `0003_sites.sql` | `sites` + `publications` (snapshots inmutables) |
| `0004_conversations.sql` | `conversations` + `message_role` enum + `messages` |
| `0005_traces.sql` | `trace_status` enum + `agent_traces` |
| `0006_helpers.sql` | Funciones `has_active_subscription`, `get_published_site_by_slug`, `monthly_agent_turns` |

## Decisiones reflejadas en el schema

| Decisión aprobada | Cómo se enforce |
|---|---|
| #4 Magic link único | `supabase/config.toml` desactiva password signup en local. En producción se configura desde dashboard Auth → Providers |
| #5 Single-site por usuario | `idx_sites_user_one_in_mvp` UNIQUE en `sites(user_id)`. Para multi-site (SHOULD) sustituir por índice no-unique |
| #6 URLs externas para imágenes | Sin tabla `assets` ni bucket de Storage. URLs viven dentro del `content_json` de `sites` |
| #7 Eval con casos reales | `messages.content` guarda los content blocks completos en formato Anthropic. `agent_traces.eval_label` permite marcar casos para el dataset |

## Setup local

```bash
# 1. Instalar Supabase CLI (si no lo tienes)
brew install supabase/tap/supabase

# 2. En la raíz del proyecto:
supabase start
# Esto levanta Postgres + GoTrue + Storage + Studio en local.
# La primera vez tarda ~30s.

# 3. Aplicar migraciones (las corre automáticamente al start, pero
#    si las has cambiado:)
supabase db reset

# 4. Generar tipos TypeScript actualizados
npm run db:types

# 5. Verificar que RLS está activada en todas las tablas
psql "$(supabase status -o json | jq -r .DB_URL)" \
  -f scripts/check-rls.sql
```

URLs locales tras `supabase start`:

- **Studio (admin UI):** http://localhost:54323
- **API REST:** http://localhost:54321
- **DB:** postgresql://postgres:postgres@localhost:54322/postgres
- **Inbucket (emails de magic link):** http://localhost:54324

## Setup en producción

```bash
# 1. Crear proyecto en supabase.com (región Frankfurt para RGPD/EU)

# 2. Linkear el repo
supabase link --project-ref <project-ref>

# 3. Push de migraciones
supabase db push

# 4. Configurar Auth desde dashboard:
#    - Providers → Email → desactivar "Confirm email" (magic link no lo necesita)
#                       → desactivar "Enable email signups con password"
#                       → activar "Enable email magic link"
#    - URL Configuration → Site URL: https://cloudweb.app
#                       → Redirect URLs: https://cloudweb.app/auth/callback

# 5. Generar tipos contra producción
supabase gen types typescript --project-id <project-ref> > src/types/db.ts

# 6. Auditar RLS antes de exponer:
#    psql "$DATABASE_URL" -f scripts/check-rls.sql
#    Ninguna tabla debe aparecer con "RLS OFF" o con 0 policies.
```

## Notas sobre patrones

**¿Por qué `security definer` en `handle_new_user` y `security invoker` en los helpers?**

`handle_new_user` corre como trigger sobre `auth.users` (tabla del schema `auth`). Para escribir en `public.profiles` desde ahí sin requerir permisos del usuario, el trigger debe ejecutarse con permisos del owner — eso es `security definer`. Es el patrón estándar de Supabase para sincronizar tablas auth ↔ public.

Los helpers (`has_active_subscription`, etc.) corren con los permisos del caller (`security invoker`), por lo que respetan RLS. Esto significa que solo devuelven datos que el caller ya puede ver — no son un bypass de seguridad.

**¿Por qué guardamos los `tool_result` completos en `messages.content`?**

Para construir el dataset de eval en semana 2 (decisión #7) necesitamos los inputs/outputs reales del agente, no resúmenes. El crecimiento es manejable en MVP: ~5KB por turn × 30 turns/conversación × 50 usuarios × 30 días ≈ 225 MB/mes. Cuando esto crezca:

1. Añadir migración que rota mensajes > 60 días a un bucket externo
2. Reemplazar `content` con un puntero (URL al archivo)
3. Mantener metadatos de tokens/costo en la fila

**¿Por qué `publications` como tabla separada en lugar de un campo `published_content_json` en `sites`?**

Tres razones:

1. **Inmutabilidad explícita**: una publicación, una vez creada, no se modifica nunca. Tabla separada hace esto evidente y testeable.
2. **Rollback futuro**: con historial, la feature "rollback" (COULD) es trivial: copiar `content_snapshot` de una publication anterior al `content_json` de `sites`.
3. **Borrador != producción**: el usuario puede seguir editando el `content_json` mientras la publicación previa sigue sirviéndose. Sin la tabla separada, cada cambio sobreescribiría lo que ven los visitantes.

**¿Por qué no hay tabla `feature_flags` o `usage_counters`?**

MoSCoW del MVP: con un solo plan, no hace falta enforcement granular. La función `monthly_agent_turns` está lista para cuando aparezcan límites diferenciados por plan.

## Hacer cambios al schema

1. Crear nueva migración: `supabase migration new <nombre>`
2. Editar el SQL generado
3. Probar local: `supabase db reset` (re-aplica todo desde cero)
4. Si pasa: `npm run db:types` para regenerar tipos
5. Commit la migración + los tipos en el mismo PR
6. Producción: `supabase db push` tras merge a main

**Nunca edites una migración ya aplicada en producción.** Crea una migración nueva que corrige.
