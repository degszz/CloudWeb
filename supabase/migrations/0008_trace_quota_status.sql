-- =========================================================================
-- 0008_trace_quota_status.sql
--
-- Añade quota_exceeded al enum trace_status. Distingue del rate_limited
-- (que es Upstash protegiendo de abuso) — quota_exceeded es la cuota
-- mensual de 200 turns que el founder revisará caso por caso para los
-- primeros 50 usuarios (decisión de soft-block aprobada).
-- =========================================================================

alter type public.trace_status add value if not exists 'quota_exceeded';
