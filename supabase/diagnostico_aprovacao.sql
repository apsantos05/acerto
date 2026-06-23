-- =====================================================================
-- ACERTAVEST — Diagnóstico de Aprovação (approval_diagnostics)
-- Rode no Supabase: SQL Editor. Idempotente.
-- Pré-requisitos: schema.sql (profiles/auth), admin_role.sql (is_admin()).
--
-- Segurança: o INSERT é feito SOMENTE pelo servidor (service role) via
-- /api/diagnostico, que calcula o score no backend. Não há policy de insert
-- para anon/authenticated, então o cliente NÃO consegue forjar resultado.
-- Leitura: o próprio usuário (quando logado) e o admin. Diagnósticos anônimos
-- são lidos pela página de resultado por id (UUID não-adivinhável) no servidor.
-- =====================================================================

create table if not exists public.approval_diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  target_university text,
  target_vestibular text,
  target_course text,
  study_hours_range text,
  student_phase text,
  mock_exam_average text,
  strong_subjects text[] not null default '{}',
  weak_subjects text[] not null default '{}',
  mock_exams_per_month text,
  main_difficulty text,
  exam_timeline text,
  preparation_score integer not null default 0,
  approval_chance text,
  student_profile text,
  recommended_track_slug text,
  recommended_plan text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.approval_diagnostics drop constraint if exists approval_diagnostics_plan_check;
alter table public.approval_diagnostics
  add constraint approval_diagnostics_plan_check
  check (recommended_plan in ('free', 'premium', 'premium_med')) not valid;

create index if not exists approval_diagnostics_user_idx on public.approval_diagnostics (user_id);
create index if not exists approval_diagnostics_created_idx on public.approval_diagnostics (created_at desc);
create index if not exists approval_diagnostics_university_idx on public.approval_diagnostics (target_university);
create index if not exists approval_diagnostics_plan_idx on public.approval_diagnostics (recommended_plan);

-- updated_at automático (reusa touch_updated_at se existir)
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='public' and p.proname='touch_updated_at') then
    drop trigger if exists approval_diagnostics_touch on public.approval_diagnostics;
    create trigger approval_diagnostics_touch before update on public.approval_diagnostics
      for each row execute function public.touch_updated_at();
  end if;
end $$;

-- ---------------- RLS ----------------
alter table public.approval_diagnostics enable row level security;

-- Leitura: dono (logado) ou admin. Sem policies de escrita -> só service_role grava.
drop policy if exists approval_diagnostics_select_own on public.approval_diagnostics;
create policy approval_diagnostics_select_own on public.approval_diagnostics for select
  using (auth.uid() = user_id or public.is_admin());

grant select on public.approval_diagnostics to authenticated;
grant all on public.approval_diagnostics to service_role;

-- ---------------- Verificação ----------------
select 'approval_diagnostics' as item,
  (to_regclass('public.approval_diagnostics') is not null)::text as ok
union all
select 'rls_select_own',
  (exists(select 1 from pg_policies where schemaname='public' and tablename='approval_diagnostics' and policyname='approval_diagnostics_select_own'))::text;
