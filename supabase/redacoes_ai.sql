-- =====================================================================
-- ACERTAVEST — Correção de Redação por IA (essay_submissions)
-- Rode no Supabase: SQL Editor. Idempotente.
-- Pré-requisitos: schema.sql (auth/profiles), admin_role.sql (is_admin()).
--
-- Segurança: a CORREÇÃO é feita pelo servidor (service role) via
-- /api/redacoes/corrigir, que valida o limite do plano e chama a IA. Não há
-- policy de insert/update para o cliente -> ele não burla limite nem forja nota.
-- Leitura: o dono e o admin.
-- =====================================================================

create table if not exists public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_type text not null default 'enem',
  theme text not null default '',
  essay_text text not null default '',
  word_count integer not null default 0,
  status text not null default 'processing',
  score_total integer,
  score_competencia_1 integer,
  score_competencia_2 integer,
  score_competencia_3 integer,
  score_competencia_4 integer,
  score_competencia_5 integer,
  feedback_general text,
  feedback_structure text,
  feedback_grammar text,
  feedback_argumentation text,
  feedback_intervention text,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  suggested_rewrite text,
  ai_model text,
  ai_raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.essay_submissions drop constraint if exists essay_submissions_exam_check;
alter table public.essay_submissions
  add constraint essay_submissions_exam_check
  check (exam_type in ('enem', 'fuvest', 'unicamp', 'tradicional')) not valid;

alter table public.essay_submissions drop constraint if exists essay_submissions_status_check;
alter table public.essay_submissions
  add constraint essay_submissions_status_check
  check (status in ('processing', 'completed', 'failed')) not valid;

create index if not exists essay_submissions_user_idx on public.essay_submissions (user_id);
create index if not exists essay_submissions_created_idx on public.essay_submissions (created_at desc);
create index if not exists essay_submissions_exam_idx on public.essay_submissions (exam_type);
create index if not exists essay_submissions_status_idx on public.essay_submissions (status);

-- updated_at automático (reusa touch_updated_at se existir)
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='public' and p.proname='touch_updated_at') then
    drop trigger if exists essay_submissions_touch on public.essay_submissions;
    create trigger essay_submissions_touch before update on public.essay_submissions
      for each row execute function public.touch_updated_at();
  end if;
end $$;

-- ---------------- RLS ----------------
alter table public.essay_submissions enable row level security;

-- Leitura: dono ou admin. Sem policies de escrita -> só service_role grava.
drop policy if exists essay_submissions_select_own on public.essay_submissions;
create policy essay_submissions_select_own on public.essay_submissions for select
  using (auth.uid() = user_id or public.is_admin());

grant select on public.essay_submissions to authenticated;
grant all on public.essay_submissions to service_role;

-- ---------------- Verificação ----------------
select 'essay_submissions' as item,
  (to_regclass('public.essay_submissions') is not null)::text as ok
union all
select 'rls_select_own',
  (exists(select 1 from pg_policies where schemaname='public' and tablename='essay_submissions' and policyname='essay_submissions_select_own'))::text;
