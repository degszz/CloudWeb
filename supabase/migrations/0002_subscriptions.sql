-- =========================================================================
-- 0002_subscriptions.sql
--
-- Tabla subscriptions sincronizada desde el webhook de Stripe.
-- saas_backend.md: "el webhook es la fuente de la verdad — nunca
-- confíes en el front para saber si un usuario ha pagado".
--
-- Solo el webhook (con service_role) escribe aquí. Los Server
-- Components leen con la sesión del usuario (RLS lo permite solo
-- para su propia fila).
-- =========================================================================

create type public.subscription_status as enum (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

create table public.subscriptions (
  -- PK = Stripe subscription ID. Permite UPSERT idempotente desde el webhook.
  id text primary key,

  user_id uuid not null references public.profiles(id) on delete cascade,

  status public.subscription_status not null,
  price_id text not null,
  quantity integer not null default 1,

  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'Estado Stripe sincronizado por webhook. Fuente de verdad para gating de features.';

create index idx_subscriptions_user on public.subscriptions(user_id);

-- Lookup rápido para "¿este usuario tiene una suscripción activa?"
-- usado por lib/subscription.ts.
create index idx_subscriptions_user_active
  on public.subscriptions(user_id, status)
  where status in ('active', 'trialing');

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =========================================================================
-- RLS — subscriptions
-- =========================================================================
alter table public.subscriptions enable row level security;

-- Lectura: solo la propia suscripción
create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Sin policies de INSERT/UPDATE/DELETE para roles autenticados:
-- solo el service_role del webhook puede escribir aquí.
-- security_auditor.md: "verifica que la base de datos use políticas
-- de acceso a nivel de fila".
