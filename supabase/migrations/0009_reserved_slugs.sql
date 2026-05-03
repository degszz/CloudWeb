-- =========================================================================
-- 0009_reserved_slugs.sql
--
-- Slugs reservados que no pueden usarse como subdominio.
--
-- Razones:
--   - 'dashboard', 'builder', 'settings', 'login' chocarían con rutas internas
--   - 'api', 'auth' romperían el routing
--   - 'www' suele ser un alias del dominio principal
--   - 'admin', 'support', 'help' son convenciones que queremos preservar
--   - 'mail', 'email' confunden con servicios de correo
--
-- Implementación: tabla con check constraint via función. Esto es más
-- mantenible que un check inline (podemos añadir slugs sin migración).
-- =========================================================================

create table public.reserved_slugs (
  slug text primary key
);

comment on table public.reserved_slugs is
  'Slugs que no pueden usarse como subdominio público. Se valida en sites_check_slug_not_reserved.';

insert into public.reserved_slugs (slug) values
  ('www'),
  ('app'),
  ('api'),
  ('admin'),
  ('auth'),
  ('login'),
  ('logout'),
  ('signup'),
  ('signin'),
  ('register'),
  ('dashboard'),
  ('builder'),
  ('settings'),
  ('billing'),
  ('account'),
  ('profile'),
  ('help'),
  ('support'),
  ('docs'),
  ('blog'),
  ('mail'),
  ('email'),
  ('cdn'),
  ('static'),
  ('assets'),
  ('public'),
  ('private'),
  ('terms'),
  ('privacy'),
  ('cookies'),
  ('legal'),
  ('cloudweb'),
  ('tu'),
  ('mi'),
  ('hola'),
  ('about'),
  ('contact'),
  ('pricing');

-- =========================================================================
-- Trigger que valida slug no reservado en sites
-- =========================================================================
create or replace function public.check_slug_not_reserved()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.reserved_slugs where slug = new.slug) then
    raise exception 'El subdominio "%" está reservado. Elige otro.', new.slug
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger sites_check_slug_not_reserved
  before insert or update of slug on public.sites
  for each row execute function public.check_slug_not_reserved();

-- =========================================================================
-- RLS de reserved_slugs: lectura pública, sin escritura
-- =========================================================================
alter table public.reserved_slugs enable row level security;

create policy "reserved_slugs_select_all"
  on public.reserved_slugs
  for select
  using (true);
-- Sin INSERT/UPDATE/DELETE: solo se modifica con migraciones (service_role).
