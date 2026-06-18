-- =====================================================================
-- ACERTE — Simulados com timer persistente + regras oficiais
-- Rode no Supabase: SQL Editor. Idempotente. (Pré-req: simulados.sql)
-- =====================================================================

-- Regras oficiais + tempo oficial na tabela de simulados
alter table public.simulados add column if not exists rules text;
alter table public.simulados add column if not exists official_minutes integer not null default 0;
alter table public.simulados add column if not exists official_questions integer not null default 0;

-- Campos de tentativa: duração e status
alter table public.simulado_attempts add column if not exists duration_minutes integer not null default 0;
alter table public.simulado_attempts add column if not exists status text not null default 'completed';

-- Migra tentativas antigas para o novo status
update public.simulado_attempts
  set status = case when finished_at is not null then 'completed' else 'in_progress' end
  where status not in ('in_progress', 'completed', 'expired');

alter table public.simulado_attempts drop constraint if exists simulado_attempts_status_check;
alter table public.simulado_attempts
  add constraint simulado_attempts_status_check check (status in ('in_progress', 'completed', 'expired'));

-- Backfill duration_minutes a partir do simulado
update public.simulado_attempts a
  set duration_minutes = s.duration_minutes
  from public.simulados s
  where a.simulado_id = s.id and a.duration_minutes = 0;

-- ---------------- RPC: iniciar (cria OU retoma a tentativa em andamento) -------------
create or replace function public.start_simulado(p_simulado_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_started timestamptz;
  v_dur integer;
  v_total integer;
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.simulados where id = p_simulado_id and status = 'published') then
    raise exception 'Simulado indisponível.';
  end if;

  -- Retoma tentativa em andamento (impede reiniciar o tempo ao recarregar)
  select id, started_at, duration_minutes, total_questions
    into v_id, v_started, v_dur, v_total
  from public.simulado_attempts
  where simulado_id = p_simulado_id and user_id = v_user and status = 'in_progress'
  order by started_at desc limit 1;

  if v_id is not null then
    return jsonb_build_object('attempt_id', v_id, 'started_at', v_started,
      'duration_minutes', v_dur, 'total_questions', v_total, 'resumed', true);
  end if;

  select duration_minutes into v_dur from public.simulados where id = p_simulado_id;
  select count(*) into v_total from public.simulado_questions where simulado_id = p_simulado_id;

  insert into public.simulado_attempts (simulado_id, user_id, total_questions, duration_minutes, status, started_at, score)
  values (p_simulado_id, v_user, v_total, coalesce(v_dur, 60), 'in_progress', now(), 0)
  returning id, started_at into v_id, v_started;

  return jsonb_build_object('attempt_id', v_id, 'started_at', v_started,
    'duration_minutes', coalesce(v_dur, 60), 'total_questions', v_total, 'resumed', false);
end;
$$;
grant execute on function public.start_simulado(uuid) to authenticated;

-- ---------------- RPC: finalizar (corrige no servidor) -------------
create or replace function public.finish_simulado(
  p_attempt_id uuid, p_answers jsonb, p_expired boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_sim uuid;
  v_status text;
  v_total integer := 0;
  v_correct integer := 0;
  q record; sel text; ok boolean;
  results jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;

  select simulado_id, status into v_sim, v_status
  from public.simulado_attempts where id = p_attempt_id and user_id = v_user;
  if v_sim is null then raise exception 'Tentativa não encontrada.'; end if;
  if v_status <> 'in_progress' then raise exception 'Tentativa já finalizada.'; end if;

  delete from public.simulado_answers where attempt_id = p_attempt_id;

  for q in select * from public.simulado_questions where simulado_id = v_sim order by order_index loop
    v_total := v_total + 1;
    sel := p_answers ->> (q.id::text);
    ok := sel is not null and upper(sel) = upper(q.correct_answer);
    if ok then v_correct := v_correct + 1; end if;
    insert into public.simulado_answers (attempt_id, question_id, selected_answer, is_correct)
    values (p_attempt_id, q.id, sel, ok);
    results := results || jsonb_build_object(
      'question_id', q.id, 'subject', q.subject, 'question_text', q.question_text,
      'alternatives', q.alternatives, 'selected', sel, 'correct_answer', q.correct_answer,
      'is_correct', ok, 'explanation', q.explanation);
  end loop;

  update public.simulado_attempts
    set score = v_correct,
        status = case when p_expired then 'expired' else 'completed' end,
        finished_at = now()
  where id = p_attempt_id;

  return jsonb_build_object('attempt_id', p_attempt_id, 'score', v_correct,
    'total', v_total, 'results', results, 'expired', p_expired);
end;
$$;
grant execute on function public.finish_simulado(uuid, jsonb, boolean) to authenticated;

select 'simulado_attempts.status' as item,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='simulado_attempts' and column_name='status') as ok
union all
select 'start_simulado', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='start_simulado')
union all
select 'finish_simulado', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='finish_simulado');
