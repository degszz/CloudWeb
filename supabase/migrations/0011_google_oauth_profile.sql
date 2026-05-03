-- =========================================================================
-- 0011_google_oauth_profile.sql
--
-- Actualiza el trigger handle_new_user para capturar datos de Google OAuth.
--
-- Cuando un usuario se registra con Google, Supabase guarda metadata
-- como full_name, avatar_url, email en raw_user_meta_data. Este trigger
-- actualizado los extrae para popular el profile automáticamente.
--
-- Para magic link el comportamiento no cambia (los campos quedan null
-- si no están en metadata).
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      null
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      null
    )
  )
  on conflict (id) do update set
    full_name = coalesce(
      excluded.full_name,
      profiles.full_name
    ),
    avatar_url = coalesce(
      excluded.avatar_url,
      profiles.avatar_url
    ),
    updated_at = now();

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crea o actualiza profile al signup. Captura name y avatar de Google OAuth si están disponibles.';
