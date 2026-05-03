-- =========================================================================
-- 0001_init.sql
--
-- Profiles + extensiones requeridas + trigger de auto-creación al signup.
--
-- profiles extiende auth.users (gestionada por Supabase) con los campos
-- propios de CloudWeb. La PK es la misma que auth.users.id, lo que nos
-- permite hacer auth.uid() = id en RLS sin joins.
-- =========================================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- =========================================================================
-- profiles
-- =========================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil del usuario. 1:1 con auth.users. Creado por trigger al signup.';

-- Índice para lookups rápidos por stripe_customer_id desde el webhook
create index idx_profiles_stripe_customer
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;

-- Trigger updated_at automático (reutilizable en otras tablas)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Trigger handle_new_user — crea profile automáticamente al signup
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  );
  return new;
end;
$$;

-- security definer hace que la función corra con permisos del owner,
-- no del usuario que dispara el trigger. Necesario para escribir en
-- public.profiles desde un evento en auth.users.

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- RLS — profiles
-- =========================================================================
alter table public.profiles enable row level security;

-- Lectura: solo el propio perfil
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Update: solo el propio perfil, y solo campos no sensibles
-- (stripe_customer_id se actualiza desde el webhook con service_role,
-- no desde el cliente).
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Sin policies de INSERT ni DELETE: solo el trigger handle_new_user
-- (security definer) crea perfiles, y la cascada de auth.users los borra.
