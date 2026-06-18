-- =====================================================================
-- ACERTE — Plano de estudos: study_tasks + weekly_goals
-- Rode no Supabase: SQL Editor. Idempotente.
-- =====================================================================

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'pending' check (status in ('pending', 'done')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_tasks_user_idx on public.study_tasks (user_id);

create table if not exists public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active', 'done')),
  week_start date,
  week_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists weekly_goals_user_idx on public.weekly_goals (user_id);

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_study_tasks_touch on public.study_tasks;
create trigger trg_study_tasks_touch before update on public.study_tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_weekly_goals_touch on public.weekly_goals;
create trigger trg_weekly_goals_touch before update on public.weekly_goals
  for each row execute function public.touch_updated_at();

-- RLS: cada usuário só acessa os próprios registros
alter table public.study_tasks enable row level security;
drop policy if exists study_tasks_select_own on public.study_tasks;
create policy study_tasks_select_own on public.study_tasks for select using (auth.uid() = user_id);
drop policy if exists study_tasks_insert_own on public.study_tasks;
create policy study_tasks_insert_own on public.study_tasks for insert with check (auth.uid() = user_id);
drop policy if exists study_tasks_update_own on public.study_tasks;
create policy study_tasks_update_own on public.study_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists study_tasks_delete_own on public.study_tasks;
create policy study_tasks_delete_own on public.study_tasks for delete using (auth.uid() = user_id);

alter table public.weekly_goals enable row level security;
drop policy if exists weekly_goals_select_own on public.weekly_goals;
create policy weekly_goals_select_own on public.weekly_goals for select using (auth.uid() = user_id);
drop policy if exists weekly_goals_insert_own on public.weekly_goals;
create policy weekly_goals_insert_own on public.weekly_goals for insert with check (auth.uid() = user_id);
drop policy if exists weekly_goals_update_own on public.weekly_goals;
create policy weekly_goals_update_own on public.weekly_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists weekly_goals_delete_own on public.weekly_goals;
create policy weekly_goals_delete_own on public.weekly_goals for delete using (auth.uid() = user_id);

-- Verificação
select 'study_tasks' as item, exists(select 1 from information_schema.tables where table_schema='public' and table_name='study_tasks') as ok
union all
select 'weekly_goals', exists(select 1 from information_schema.tables where table_schema='public' and table_name='weekly_goals');
