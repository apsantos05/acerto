-- =====================================================================
-- ACERTE — Edição de materiais pela moderação (admin)
-- Adiciona histórico de alteração (updated_at/updated_by) + trigger.
-- Rode no Supabase: SQL Editor. Idempotente. (Pré-req: schema.sql,
-- admin_role.sql, fix_rls_write.sql, materials_ingest.sql, materials_ai.sql)
-- =====================================================================

alter table public.materials
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

-- updated_at automático em qualquer UPDATE (reusa o padrão do projeto).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_materials_touch on public.materials;
create trigger trg_materials_touch
  before update on public.materials
  for each row execute function public.touch_updated_at();

-- Reafirma a policy de UPDATE do admin (idempotente) — permite ao admin
-- editar QUALQUER coluna de QUALQUER material, não só o status.
drop policy if exists materials_admin_update on public.materials;
create policy materials_admin_update
  on public.materials for update
  using (public.is_admin())
  with check (public.is_admin());

-- Verificação
select 'materials.updated_at' as item,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='updated_at') as ok
union all
select 'materials.updated_by',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='updated_by')
union all
select 'trigger trg_materials_touch',
  exists(select 1 from pg_trigger where tgname='trg_materials_touch')
union all
select 'policy materials_admin_update',
  exists(select 1 from pg_policies where schemaname='public' and tablename='materials' and policyname='materials_admin_update');
