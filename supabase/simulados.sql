-- =====================================================================
-- ACERTE — Área de Simulados (questões AUTORAIS)
-- Rode no Supabase: SQL Editor. Idempotente. (Pré-req: admin_role.sql -> is_admin())
-- =====================================================================

create table if not exists public.simulados (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  vestibular text not null default 'Geral',
  faculty text not null default 'Medicina',
  duration_minutes integer not null default 60,
  difficulty text not null default 'médio',
  subjects text[] not null default '{}',
  question_count integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table if not exists public.simulado_questions (
  id uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  subject text not null default 'Geral',
  question_text text not null,
  alternatives jsonb not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D', 'E')),
  explanation text,
  difficulty text not null default 'médio',
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists simulado_questions_simulado_idx on public.simulado_questions (simulado_id);

create table if not exists public.simulado_attempts (
  id uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0,
  total_questions integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists simulado_attempts_user_idx on public.simulado_attempts (user_id);

create table if not exists public.simulado_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulado_attempts(id) on delete cascade,
  question_id uuid not null references public.simulado_questions(id) on delete cascade,
  selected_answer text,
  is_correct boolean not null default false
);
create index if not exists simulado_answers_attempt_idx on public.simulado_answers (attempt_id);

-- ---------------- RLS ----------------
alter table public.simulados enable row level security;
alter table public.simulado_questions enable row level security;
alter table public.simulado_attempts enable row level security;
alter table public.simulado_answers enable row level security;

-- simulados: todos veem publicados; admin gerencia
drop policy if exists simulados_select on public.simulados;
create policy simulados_select on public.simulados for select
  using (status = 'published' or public.is_admin());
drop policy if exists simulados_admin_all on public.simulados;
create policy simulados_admin_all on public.simulados for all
  using (public.is_admin()) with check (public.is_admin());

-- questions: somente admin lê direto (o aluno recebe via RPC sem o gabarito)
drop policy if exists simulado_questions_admin on public.simulado_questions;
create policy simulado_questions_admin on public.simulado_questions for all
  using (public.is_admin()) with check (public.is_admin());

-- attempts/answers: cada usuário só os seus
drop policy if exists simulado_attempts_own on public.simulado_attempts;
create policy simulado_attempts_own on public.simulado_attempts for select
  using (auth.uid() = user_id);
drop policy if exists simulado_answers_own on public.simulado_answers;
create policy simulado_answers_own on public.simulado_answers for select
  using (exists (select 1 from public.simulado_attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- ---------------- RPCs ----------------
-- Questões SEM o gabarito (para o aluno responder)
create or replace function public.get_simulado_questions(p_simulado_id uuid)
returns table (
  id uuid, subject text, question_text text, alternatives jsonb,
  difficulty text, order_index integer
)
language sql stable security definer set search_path = public as $$
  select q.id, q.subject, q.question_text, q.alternatives, q.difficulty, q.order_index
  from public.simulado_questions q
  join public.simulados s on s.id = q.simulado_id
  where q.simulado_id = p_simulado_id and s.status = 'published'
  order by q.order_index;
$$;
grant execute on function public.get_simulado_questions(uuid) to anon, authenticated;

-- Corrige no servidor, grava tentativa + respostas, devolve o resultado com gabarito/explicações.
-- p_answers: objeto jsonb { "<question_id>": "A", ... }
create or replace function public.submit_simulado(p_simulado_id uuid, p_answers jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_attempt uuid;
  v_total integer;
  v_correct integer := 0;
  q record;
  sel text;
  ok boolean;
  results jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'É preciso estar logado para enviar o simulado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.simulados where id = p_simulado_id and status = 'published') then
    raise exception 'Simulado indisponível.';
  end if;

  select count(*) into v_total from public.simulado_questions where simulado_id = p_simulado_id;

  insert into public.simulado_attempts (simulado_id, user_id, total_questions, started_at, finished_at, score)
  values (p_simulado_id, v_user, v_total, now(), now(), 0)
  returning id into v_attempt;

  for q in
    select * from public.simulado_questions where simulado_id = p_simulado_id order by order_index
  loop
    sel := p_answers ->> (q.id::text);
    ok := sel is not null and upper(sel) = upper(q.correct_answer);
    if ok then v_correct := v_correct + 1; end if;

    insert into public.simulado_answers (attempt_id, question_id, selected_answer, is_correct)
    values (v_attempt, q.id, sel, ok);

    results := results || jsonb_build_object(
      'question_id', q.id,
      'subject', q.subject,
      'question_text', q.question_text,
      'alternatives', q.alternatives,
      'selected', sel,
      'correct_answer', q.correct_answer,
      'is_correct', ok,
      'explanation', q.explanation
    );
  end loop;

  update public.simulado_attempts set score = v_correct where id = v_attempt;

  return jsonb_build_object(
    'attempt_id', v_attempt,
    'score', v_correct,
    'total', v_total,
    'results', results
  );
end;
$$;
grant execute on function public.submit_simulado(uuid, jsonb) to authenticated;

select 'simulados' as item, exists(select 1 from information_schema.tables where table_schema='public' and table_name='simulados') as ok
union all select 'submit_simulado', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='submit_simulado');
