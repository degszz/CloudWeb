-- =========================================================================
-- 0005_traces.sql
--
-- Tabla agent_traces: una fila por cada turno completo del agente
-- (un user message → respuesta final del asistente, posiblemente con
-- N iteraciones de tool calling intermedias).
--
-- Sustituye Langfuse en MVP (decisión documentada en sección 1 del
-- documento de arquitectura, conflicto resuelto). Migrable a Langfuse
-- post-validación con un script de export.
-- =========================================================================

create type public.trace_status as enum (
  'success',
  'max_iterations',
  'tool_error',
  'guardrail_input_block',
  'guardrail_output_block',
  'rate_limited',
  'model_error'
);

create table public.agent_traces (
  id uuid primary key default gen_random_uuid(),

  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,

  -- Qué disparó este turno: 'user_message' (por defecto), 'retry', etc.
  trigger text not null default 'user_message',
  iterations integer not null default 0,

  -- Array de tool calls del turno: [{name, input, success, error?, latency_ms}].
  -- jsonb permite consultas analíticas (qué tools fallan más, etc).
  tools_called jsonb not null default '[]'::jsonb,

  -- Agregados del turno completo
  total_input_tokens integer,
  total_output_tokens integer,
  total_cache_read_tokens integer,
  total_cache_creation_tokens integer,
  total_cost_usd numeric(10, 6),
  total_latency_ms integer,

  status public.trace_status not null,
  error_detail text,

  -- Para el dataset de eval: marcar manualmente desde admin/SQL las
  -- conversaciones que se quieren incluir en eval set.
  eval_label text,
  eval_marked_at timestamptz,

  created_at timestamptz not null default now()
);

comment on table public.agent_traces is
  'Telemetría por turno del agente. Base del dataset de eval (semana 2).';

-- Análisis por usuario y tiempo
create index idx_traces_user_created
  on public.agent_traces(user_id, created_at desc);

-- Encuentra rápido los turns que fallaron (para debug y eval)
create index idx_traces_status_partial
  on public.agent_traces(created_at desc)
  where status != 'success';

-- Filtra los marcados para eval
create index idx_traces_eval_label
  on public.agent_traces(eval_label, created_at)
  where eval_label is not null;

-- =========================================================================
-- RLS — agent_traces
-- =========================================================================
alter table public.agent_traces enable row level security;

-- El usuario lee sus propios traces (útil para mostrarle "logs" en
-- algún panel de soporte futuro). En MVP el panel no existe pero
-- la policy es la correcta por construcción.
create policy "traces_select_own"
  on public.agent_traces
  for select
  using (auth.uid() = user_id);

-- INSERT solo desde server (service_role). Sin UPDATE/DELETE: traces
-- son inmutables salvo para marcar eval_label, lo que se hará desde
-- el SQL editor o admin script con service_role.
