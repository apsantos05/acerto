-- =====================================================================
-- ACERTE — Histórico/arquivo do plano de estudos
-- Adiciona completed_at/archived_at e migra status para active|completed|archived.
-- Rode no Supabase: SQL Editor. Idempotente. (Pré-req: study_planner.sql)
-- =====================================================================

-- Garante as tabelas (no schema novo) caso study_planner.sql não tenha rodado
create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'active',
  due_date date,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'active',
  week_start date,
  week_end date,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colunas de histórico
alter table public.study_tasks  add column if not exists completed_at timestamptz;
alter table public.study_tasks  add column if not exists archived_at  timestamptz;
alter table public.weekly_goals add column if not exists completed_at timestamptz;
alter table public.weekly_goals add column if not exists archived_at  timestamptz;

-- Migra valores de status antigos -> active | completed | archived
alter table public.study_tasks  drop constraint if exists study_tasks_status_check;
alter table public.weekly_goals drop constraint if exists weekly_goals_status_check;

update public.study_tasks  set status = 'active'    where status = 'pending';
update public.study_tasks  set status = 'completed' where status = 'done';
update public.weekly_goals set status = 'completed' where status = 'done';

update public.study_tasks  set completed_at = coalesce(completed_at, updated_at) where status = 'completed' and completed_at is null;
update public.weekly_goals set completed_at = coalesce(completed_at, updated_at) where status = 'completed' and completed_at is null;

alter table public.study_tasks  alter column status set default 'active';
alter table public.weekly_goals alter column status set default 'active';

alter table public.study_tasks
  add constraint study_tasks_status_check check (status in ('active', 'completed', 'archived'));
alter table public.weekly_goals
  add constraint weekly_goals_status_check check (status in ('active', 'completed', 'archived'));

-- RLS continua own-only (reafirma, idempotente)
alter table public.study_tasks  enable row level security;
alter table public.weekly_goals enable row level security;
do $$
begin
  -- garante as policies (caso study_planner.sql não tenha rodado)
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='study_tasks' and policyname='study_tasks_select_own') then
    execute 'create policy study_tasks_select_own on public.study_tasks for select using (auth.uid() = user_id)';
    execute 'create policy study_tasks_insert_own on public.study_tasks for insert with check (auth.uid() = user_id)';
    execute 'create policy study_tasks_update_own on public.study_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'create policy study_tasks_delete_own on public.study_tasks for delete using (auth.uid() = user_id)';
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_goals' and policyname='weekly_goals_select_own') then
    execute 'create policy weekly_goals_select_own on public.weekly_goals for select using (auth.uid() = user_id)';
    execute 'create policy weekly_goals_insert_own on public.weekly_goals for insert with check (auth.uid() = user_id)';
    execute 'create policy weekly_goals_update_own on public.weekly_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
    execute 'create policy weekly_goals_delete_own on public.weekly_goals for delete using (auth.uid() = user_id)';
  end if;
end;
$$;

select 'study_tasks.completed_at' as item, exists(select 1 from information_schema.columns where table_schema='public' and table_name='study_tasks' and column_name='completed_at') as ok
union all
select 'weekly_goals.completed_at', exists(select 1 from information_schema.columns where table_schema='public' and table_name='weekly_goals' and column_name='completed_at');
