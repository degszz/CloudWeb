-- =========================================================================
-- 0004_conversations.sql
--
-- Persistencia de conversaciones con el agente.
--
-- Decisión: guardamos los content blocks completos en formato Anthropic
-- (incluyendo tool_use y tool_result). Esto es valioso para el dataset
-- de eval que construimos en semana 2 (decisión #7).
--
-- Plan de truncado para escala futura: cuando una conversación supere
-- N mensajes o el JSON de tool_result supere M KB, hacemos summary
-- conversacional (ai_agent_core.md §6) y movemos los crudos a un bucket
-- de archivo (S3/R2). En MVP, no es necesario.
-- =========================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Generado del primer mensaje del usuario (primeras 80 chars).
  -- Vacío si el primer turno es solo "hola".
  title text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.conversations is
  'Conversación de un usuario con el agente IA sobre un sitio.';

create index idx_conversations_site_updated
  on public.conversations(site_id, updated_at desc);

create index idx_conversations_user_updated
  on public.conversations(user_id, updated_at desc);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- =========================================================================
-- message_role enum
-- =========================================================================
create type public.message_role as enum ('user', 'assistant', 'tool');

-- =========================================================================
-- messages
-- =========================================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role public.message_role not null,

  -- Array de content blocks en formato Anthropic:
  --   [{ type: 'text', text: '...' }]
  --   [{ type: 'tool_use', id: '...', name: '...', input: {...} }]
  --   [{ type: 'tool_result', tool_use_id: '...', content: ... }]
  content jsonb not null,

  -- Metadatos para observabilidad y construcción de dataset de eval.
  -- Solo populated en mensajes assistant (tras llamada al modelo).
  model text,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_creation_tokens integer,
  cost_usd numeric(10, 6),
  latency_ms integer,
  stop_reason text,

  -- Versión del system prompt usada en este turno. Permite reproducir
  -- el dataset de eval con prompts antiguos cuando iteremos.
  prompt_version text,

  created_at timestamptz not null default now()
);

comment on table public.messages is
  'Mensajes individuales en formato Anthropic content blocks. Inmutables.';

create index idx_messages_conversation
  on public.messages(conversation_id, created_at);

-- =========================================================================
-- RLS — conversations
-- =========================================================================
alter table public.conversations enable row level security;

create policy "conversations_select_own"
  on public.conversations
  for select
  using (auth.uid() = user_id);

create policy "conversations_insert_own"
  on public.conversations
  for insert
  with check (auth.uid() = user_id);

create policy "conversations_update_own"
  on public.conversations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "conversations_delete_own"
  on public.conversations
  for delete
  using (auth.uid() = user_id);

-- =========================================================================
-- RLS — messages
-- =========================================================================
alter table public.messages enable row level security;

-- Lectura: solo mensajes de conversaciones propias
create policy "messages_select_own"
  on public.messages
  for select
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- Sin INSERT/UPDATE/DELETE para roles autenticados:
-- los mensajes los crea el runner del agente (server-side, service_role)
-- después de validar input/output con guardrails. El cliente NO puede
-- inyectar mensajes directamente.
