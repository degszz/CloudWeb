-- =========================================================================
-- check-rls.sql
--
-- Auditoría defensiva: verifica que TODAS las tablas con datos de
-- usuario tienen RLS activada. security_auditor.md exige esto antes
-- de producción.
--
-- Ejecuta:
--   psql "$DATABASE_URL" -f scripts/check-rls.sql
--
-- O desde el SQL editor de Supabase. Si alguna tabla aparece sin RLS,
-- es un agujero — corregir antes de ir live.
-- =========================================================================

-- 1. Tablas en public sin RLS activada
select
  schemaname,
  tablename,
  case
    when rowsecurity then '✓ RLS ON'
    else '✗ RLS OFF — REVISAR'
  end as status
from pg_tables
where schemaname = 'public'
order by rowsecurity asc, tablename;

-- 2. Tablas con RLS activada pero SIN policies (= deny all, probablemente bug)
select
  pt.schemaname,
  pt.tablename,
  count(pp.policyname) as policy_count
from pg_tables pt
left join pg_policies pp
  on pp.schemaname = pt.schemaname
  and pp.tablename = pt.tablename
where pt.schemaname = 'public'
  and pt.rowsecurity = true
group by pt.schemaname, pt.tablename
having count(pp.policyname) = 0;

-- 3. Listado completo de policies actuales (para revisar manualmente)
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;
