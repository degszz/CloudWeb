-- =========================================================================
-- 0006_helpers.sql
--
-- Funciones helper para gating de features y enforcement de cuotas.
--
-- Estas funciones son SECURITY INVOKER (corren con permisos del caller),
-- por lo que respetan RLS — devuelven solo lo que el caller puede ver.
-- =========================================================================

-- =========================================================================
-- has_active_subscription(user_id)
--
-- Devuelve true si el usuario tiene una suscripción que le permite
-- usar el producto: 'active' o 'trialing'. Usado por el handler del
-- chat del agente, publish, etc.
-- =========================================================================
create or replace function public.has_active_subscription(check_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = check_user_id
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  );
$$;

comment on function public.has_active_subscription(uuid) is
  'Gating de features. true si el usuario tiene plan activo o en trial vigente.';

-- =========================================================================
-- get_published_site_by_slug(slug)
--
-- Resolución pública (server-side, llamada con service_role) para
-- renderizar un sitio publicado. Devuelve la última publicación
-- válida o null si no existe / no está publicada.
--
-- Filtramos por sites.is_published = true a nivel aplicación porque
-- el cliente que llama (admin) bypasea RLS.
-- =========================================================================
create or replace function public.get_published_site_by_slug(target_slug text)
returns table (
  site_id uuid,
  publication_id uuid,
  content jsonb,
  title text,
  description text,
  published_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    s.id as site_id,
    p.id as publication_id,
    p.content_snapshot as content,
    p.published_title as title,
    p.published_description as description,
    p.published_at
  from public.sites s
  inner join public.publications p
    on p.site_id = s.id
    and p.version = s.last_published_version
  where s.slug = target_slug
    and s.is_published = true
  limit 1;
$$;

comment on function public.get_published_site_by_slug(text) is
  'Resolución de subdominio → última publicación. Llamada por server con service_role.';

-- =========================================================================
-- monthly_agent_turns(user_id)
--
-- Cuenta los turns del agente del usuario en el ciclo de facturación
-- actual (últimos 30 días como aproximación en MVP).
--
-- En MVP no enforcemos límite duro porque solo hay un plan, pero la
-- función está lista para cuando lo necesitemos (SHOULD del MoSCoW:
-- usage_counters).
-- =========================================================================
create or replace function public.monthly_agent_turns(check_user_id uuid)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer
  from public.agent_traces
  where user_id = check_user_id
    and created_at > now() - interval '30 days'
    and status = 'success';
$$;

comment on function public.monthly_agent_turns(uuid) is
  'Cuenta de turns del agente en últimos 30 días. Base para enforcement de límites de plan.';
