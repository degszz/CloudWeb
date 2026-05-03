-- =========================================================================
-- 0003_sites.sql
--
-- Sites (un site = una web del usuario) y publications (snapshots
-- inmutables de cada vez que el usuario publica).
--
-- Decisión #5 confirmada: 1 site por usuario en MVP. El UNIQUE
-- constraint sobre user_id lo enforce. Cuando habilitemos multi-site
-- (SHOULD post-MVP) este UNIQUE se sustituye por un índice no-unique.
-- =========================================================================

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Subdominio en {slug}.cloudweb.app. kebab-case, 3-30 chars.
  slug text not null
    constraint sites_slug_format check (
      slug ~ '^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$'
    ),
  name text not null,
  description text,

  -- Borrador: contenido del builder (modelo D, sección 2 del documento
  -- de arquitectura). El usuario puede editar esto cuando quiera.
  -- La versión publicada vive en publications.
  content_json jsonb not null default jsonb_build_object(
    'version', 1,
    'theme', jsonb_build_object(
      'accent', 'warm-bone',
      'headingFont', 'instrument-serif',
      'bodyFont', 'geist-sans'
    ),
    'pages', jsonb_build_array(
      jsonb_build_object(
        'slug', '/',
        'metadata', jsonb_build_object('title', '', 'description', ''),
        'sections', jsonb_build_array()
      )
    )
  ),
  content_version integer not null default 1,

  -- Estado de publicación
  is_published boolean not null default false,
  last_published_at timestamptz,
  last_published_version integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sites is
  'Borrador del sitio del usuario. Una fila por usuario en MVP.';

-- Slugs únicos globalmente (porque son subdominios)
create unique index idx_sites_slug_unique on public.sites(slug);

-- Single-site MVP: 1 site por user. Reemplazar por idx normal en SHOULD.
create unique index idx_sites_user_one_in_mvp on public.sites(user_id);

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- =========================================================================
-- publications — snapshots inmutables del content_json al publicar
-- =========================================================================
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  version integer not null,
  content_snapshot jsonb not null,

  -- Metadatos congelados en el momento de publicar
  published_title text not null,
  published_description text,
  published_slug text not null,

  published_at timestamptz not null default now()
);

comment on table public.publications is
  'Snapshot inmutable de cada publicación. Permite rollback y separa borrador de producción.';

-- Lookup por (site, version) para rollback futuro
create unique index idx_publications_site_version
  on public.publications(site_id, version);

-- Lookup rápido para resolver subdomain → última publicación válida
create index idx_publications_slug_published
  on public.publications(published_slug, published_at desc);

-- =========================================================================
-- RLS — sites
-- =========================================================================
alter table public.sites enable row level security;

create policy "sites_select_own"
  on public.sites
  for select
  using (auth.uid() = user_id);

create policy "sites_insert_own"
  on public.sites
  for insert
  with check (auth.uid() = user_id);

create policy "sites_update_own"
  on public.sites
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sites_delete_own"
  on public.sites
  for delete
  using (auth.uid() = user_id);

-- =========================================================================
-- RLS — publications
-- =========================================================================
alter table public.publications enable row level security;

-- El usuario lee sus propias publicaciones (historial / rollback)
create policy "publications_select_own"
  on public.publications
  for select
  using (auth.uid() = user_id);

-- INSERT solo desde server (service_role). Ningún cliente debe
-- crear publicaciones directamente — debe pasar por el flujo de publish
-- que valida quotas, contenido y dispara el snapshot.
-- Sin policy de UPDATE/DELETE: las publications son inmutables.

-- =========================================================================
-- Render público de sitios publicados:
-- El middleware de Next.js detecta {slug}.cloudweb.app y reescribe a
-- /(public)/[slug]. Ese Route Handler usa el cliente admin (service_role)
-- para leer la última publication con published_slug=slug. Como esto
-- ocurre en server, RLS no aplica — pero el filtro is_published=true
-- en sites lo controla a nivel aplicación.
-- =========================================================================
