-- =========================================================================
-- 0007_quota.sql
--
-- Cuota mensual del agente IA: 200 turns/mes en MVP (decisión #2).
--
-- Por qué 200: una web típica son 20-40 turns. 200 cubre exploración +
-- iteración + correcciones + re-estructuración con holgura. Quien llegue
-- al límite es señal de que le encuentra valor — buena conversación
-- comercial, no problema técnico.
--
-- Política: los turns se cuentan en una ventana móvil de 30 días, no por
-- mes calendario. Esto evita el cliffhanger del día 1 de cada mes y es
-- más justo para usuarios que activan trial a finales de mes.
-- =========================================================================

create type public.quota_status as enum ('ok', 'warning', 'exceeded');

-- =========================================================================
-- agent_quota_status(user_id)
--
-- Devuelve el estado actual de la cuota del usuario.
-- Llamado por el handler /api/agent/chat antes de invocar al modelo.
-- =========================================================================
create or replace function public.agent_quota_status(check_user_id uuid)
returns table (
  used integer,
  monthly_limit integer,
  remaining integer,
  status public.quota_status
)
language sql
stable
security invoker
set search_path = public
as $$
  with usage as (
    select public.monthly_agent_turns(check_user_id) as used
  )
  select
    usage.used,
    200 as monthly_limit,
    greatest(0, 200 - usage.used) as remaining,
    case
      when usage.used >= 200 then 'exceeded'::public.quota_status
      when usage.used >= 180 then 'warning'::public.quota_status
      else 'ok'::public.quota_status
    end as status
  from usage;
$$;

comment on function public.agent_quota_status(uuid) is
  'Estado de cuota del agente: 200 turns en ventana móvil de 30 días.';
