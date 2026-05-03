-- =========================================================================
-- 0010_payment_providers.sql
--
-- Soporte para múltiples pasarelas de pago.
--
-- Stripe sigue siendo el provider por defecto para usuarios internacionales.
-- MercadoPago se usa para usuarios argentinos: cobra en ARS, el dinero
-- llega directamente en pesos a la cuenta del founder.
--
-- Cambios:
--   - Enum payment_provider
--   - Columnas provider + currency en subscriptions
--   - Tabla mercadopago_preapprovals (suscripciones de MP)
-- =========================================================================

create type public.payment_provider as enum ('stripe', 'mercadopago');

alter table public.subscriptions
  add column provider public.payment_provider not null default 'stripe',
  add column currency text not null default 'usd';

comment on column public.subscriptions.provider is
  'Pasarela que gestiona esta suscripción. stripe=internacional, mercadopago=argentina.';
comment on column public.subscriptions.currency is
  'Moneda de cobro: usd (Stripe) o ars (MercadoPago).';

-- =========================================================================
-- mercadopago_preapprovals
--
-- MercadoPago usa "preapproval" para suscripciones recurrentes.
-- Esta tabla trackea el estado del preapproval y lo mapea a nuestro
-- modelo de subscriptions.
--
-- El webhook de MP (IPN) actualiza esta tabla, y un trigger sincroniza
-- con subscriptions para mantener un modelo unificado.
-- =========================================================================
create table public.mercadopago_preapprovals (
  id text primary key,                     -- preapproval_id de MercadoPago
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Estado de MP: authorized, paused, cancelled, pending
  mp_status text not null,

  plan_id text,                            -- plan_id de MP (si se usa)
  payer_email text,
  payer_id text,

  -- Monto en ARS
  amount numeric(12, 2) not null,
  currency text not null default 'ARS',

  -- Fechas
  date_created timestamptz,
  last_modified timestamptz,
  next_payment_date timestamptz,

  -- Referencia cruzada a nuestra tabla subscriptions
  subscription_id text references public.subscriptions(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mercadopago_preapprovals is
  'Estado de suscripciones MercadoPago (preapprovals). Sincroniza con subscriptions via webhook.';

create index idx_mp_preapprovals_user on public.mercadopago_preapprovals(user_id);
create index idx_mp_preapprovals_status on public.mercadopago_preapprovals(mp_status)
  where mp_status in ('authorized', 'pending');

create trigger mp_preapprovals_set_updated_at
  before update on public.mercadopago_preapprovals
  for each row execute function public.set_updated_at();

-- =========================================================================
-- RLS
-- =========================================================================
alter table public.mercadopago_preapprovals enable row level security;

create policy "mp_preapprovals_select_own"
  on public.mercadopago_preapprovals
  for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE solo desde server (webhook con service_role).
