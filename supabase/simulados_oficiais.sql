-- =====================================================================
-- ACERTAVEST — Simulados Oficiais (categoria que reproduz os vestibulares)
-- Rode no Supabase: SQL Editor. Idempotente. Pode rodar mais de uma vez.
-- Pré-requisitos: simulados.sql, simulado_timer.sql (start/finish_simulado),
--                 plans_fixed.sql, admin_role.sql, plan_gating.sql.
--
-- Acrescenta: kind (rapido|oficial), exam_slug, exam_day, plan_required,
-- official_subjects, tri_weights; auto-save + flags + tempo + desempenho por
-- matéria + TRI nas tentativas; gating por tipo/plano; ranking por categoria;
-- e SEED das 9 provas oficiais com questões representativas (autorais).
-- =====================================================================

-- ---------------- Colunas em simulados ----------------
alter table public.simulados add column if not exists kind text not null default 'rapido';
alter table public.simulados add column if not exists exam_slug text;
alter table public.simulados add column if not exists exam_day integer;
alter table public.simulados add column if not exists plan_required text not null default 'free';
alter table public.simulados add column if not exists official_subjects jsonb not null default '[]'::jsonb;
alter table public.simulados add column if not exists tri_weights jsonb not null default '{}'::jsonb;

alter table public.simulados drop constraint if exists simulados_kind_check;
alter table public.simulados add constraint simulados_kind_check
  check (kind in ('rapido', 'oficial')) not valid;
alter table public.simulados drop constraint if exists simulados_plan_required_check;
alter table public.simulados add constraint simulados_plan_required_check
  check (plan_required in ('free', 'premium', 'premium_med')) not valid;

create index if not exists simulados_kind_idx on public.simulados (kind);
create index if not exists simulados_exam_slug_idx on public.simulados (exam_slug);

-- ---------------- Colunas em simulado_attempts (auto-save + resultado) ----------------
alter table public.simulado_attempts add column if not exists draft_answers jsonb not null default '{}'::jsonb;
alter table public.simulado_attempts add column if not exists flagged jsonb not null default '[]'::jsonb;
alter table public.simulado_attempts add column if not exists time_remaining integer;
alter table public.simulado_attempts add column if not exists ends_at timestamptz;
alter table public.simulado_attempts add column if not exists subject_scores jsonb not null default '{}'::jsonb;
alter table public.simulado_attempts add column if not exists tri_scores jsonb not null default '{}'::jsonb;

create index if not exists simulado_attempts_user_finished_idx
  on public.simulado_attempts (user_id, finished_at desc);

-- ---------------- Helper: usuário tem Premium Medicina? ----------------
create or replace function public.plan_has_premium_med(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user
      and (p.role = 'admin'
        or (p.plan = 'premium_med' and (p.premium_until is null or p.premium_until > now())))
  );
$$;
grant execute on function public.plan_has_premium_med(uuid) to anon, authenticated;

-- ---------------- start_simulado: gating por tipo/plano + ends_at ----------------
-- Free: rápidos ILIMITADOS; oficiais (premium) até 2/mês. Provas premium_med
-- (FAMERP/Einstein/Santa Casa/SLMandic) exigem o plano premium_med. Admin: total.
create or replace function public.start_simulado(p_simulado_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_id uuid; v_started timestamptz; v_dur integer; v_total integer; v_used integer;
  v_kind text; v_plan_req text;
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;

  select kind, plan_required, duration_minutes
    into v_kind, v_plan_req, v_dur
  from public.simulados where id = p_simulado_id and status = 'published';
  if v_kind is null then raise exception 'Simulado indisponível.'; end if;

  -- Retoma tentativa em andamento (não consome cota).
  select id, started_at, duration_minutes, total_questions
    into v_id, v_started, v_dur, v_total
  from public.simulado_attempts
  where simulado_id = p_simulado_id and user_id = v_user and status = 'in_progress'
  order by started_at desc limit 1;
  if v_id is not null then
    return jsonb_build_object('attempt_id', v_id, 'started_at', v_started,
      'duration_minutes', v_dur, 'total_questions', v_total, 'resumed', true);
  end if;

  -- Gating por plano da prova.
  if v_plan_req = 'premium_med' and not public.plan_has_premium_med(v_user) then
    raise exception 'Esta prova é exclusiva do plano Premium Medicina.' using errcode = 'P0001';
  end if;
  if v_plan_req = 'premium' and v_kind = 'oficial' and not public.plan_has_premium(v_user) then
    -- Free: limite de 2 simulados OFICIAIS por mês.
    select count(*) into v_used
    from public.simulado_attempts a
    join public.simulados s on s.id = a.simulado_id
    where a.user_id = v_user and s.kind = 'oficial'
      and a.started_at >= date_trunc('month', now());
    if v_used >= 2 then
      raise exception 'Limite de 2 simulados oficiais por mês no plano Gratuito. Assine o Premium para ilimitado.'
        using errcode = 'P0001';
    end if;
  end if;

  select duration_minutes into v_dur from public.simulados where id = p_simulado_id;
  select count(*) into v_total from public.simulado_questions where simulado_id = p_simulado_id;

  insert into public.simulado_attempts
    (simulado_id, user_id, total_questions, duration_minutes, status, started_at, ends_at, score, time_remaining)
  values
    (p_simulado_id, v_user, v_total, coalesce(v_dur, 60), 'in_progress', now(),
     now() + (coalesce(v_dur, 60) || ' minutes')::interval, 0, coalesce(v_dur, 60) * 60)
  returning id, started_at into v_id, v_started;

  return jsonb_build_object('attempt_id', v_id, 'started_at', v_started,
    'duration_minutes', coalesce(v_dur, 60), 'total_questions', v_total, 'resumed', false);
end;
$$;
grant execute on function public.start_simulado(uuid) to authenticated;

-- ---------------- autosave_attempt: salva respostas/flags/tempo periodicamente ----------------
create or replace function public.autosave_attempt(
  p_attempt_id uuid, p_answers jsonb, p_flagged jsonb, p_time_remaining integer
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;
  update public.simulado_attempts
    set draft_answers = coalesce(p_answers, draft_answers),
        flagged = coalesce(p_flagged, flagged),
        time_remaining = coalesce(p_time_remaining, time_remaining)
  where id = p_attempt_id and user_id = auth.uid() and status = 'in_progress';
end;
$$;
grant execute on function public.autosave_attempt(uuid, jsonb, jsonb, integer) to authenticated;

-- ---------------- finish_simulado: + desempenho por matéria + TRI ----------------
create or replace function public.finish_simulado(
  p_attempt_id uuid, p_answers jsonb, p_expired boolean default false
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_sim uuid; v_status text;
  v_total integer := 0; v_correct integer := 0;
  q record; sel text; ok boolean;
  results jsonb := '[]'::jsonb;
  v_subject jsonb := '{}'::jsonb;
  v_tri jsonb := '{}'::jsonb;
  r record;
  v_weight numeric; v_ratio numeric;
begin
  if v_user is null then raise exception 'É preciso estar logado.' using errcode = '42501'; end if;
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

  -- Desempenho por matéria (acertos/total/percentual).
  for r in
    select a.subject,
           count(*) filter (where a.is_correct) as correct,
           count(*) as total
    from public.simulado_answers a
    join public.simulado_questions q on q.id = a.question_id
    where a.attempt_id = p_attempt_id
    group by a.subject
  loop
    v_subject := v_subject || jsonb_build_object(
      r.subject, jsonb_build_object(
        'correct', r.correct, 'total', r.total,
        'percent', round((r.correct::numeric / nullif(r.total,0)) * 100)));
  end loop;

  -- TRI estimado por matéria: 300..1000 ponderado pela dificuldade.
  for r in
    select q.subject,
           sum(case q.difficulty when 'difícil' then 2 when 'fácil' then 1 else 1.5 end) as wsum,
           sum(case when ans.is_correct then (case q.difficulty when 'difícil' then 2 when 'fácil' then 1 else 1.5 end) else 0 end) as wcorrect
    from public.simulado_answers ans
    join public.simulado_questions q on q.id = ans.question_id
    where ans.attempt_id = p_attempt_id
    group by q.subject
  loop
    v_weight := nullif(r.wsum, 0);
    v_ratio := case when v_weight is null then 0 else r.wcorrect / v_weight end;
    v_tri := v_tri || jsonb_build_object(r.subject, round(300 + 700 * v_ratio));
  end loop;

  update public.simulado_attempts
    set score = v_correct,
        status = case when p_expired then 'expired' else 'completed' end,
        finished_at = now(),
        subject_scores = v_subject,
        tri_scores = v_tri
  where id = p_attempt_id;

  return jsonb_build_object('attempt_id', p_attempt_id, 'score', v_correct,
    'total', v_total, 'results', results, 'expired', p_expired,
    'subject_scores', v_subject, 'tri_scores', v_tri);
end;
$$;
grant execute on function public.finish_simulado(uuid, jsonb, boolean) to authenticated;

-- ---------------- Ranking por categoria (melhor desempenho por usuário) ----------------
create or replace function public.get_simulado_ranking(p_category text default 'geral', p_limit integer default 20)
returns table (
  rank_position bigint, profile_id uuid, username text, full_name text,
  avatar_url text, best_percent numeric, attempts bigint
)
language sql stable security definer set search_path = public as $$
  with cat as (
    select a.user_id,
           max(case when a.total_questions > 0 then (a.score::numeric / a.total_questions) * 100 else 0 end) as best_percent,
           count(*) as attempts
    from public.simulado_attempts a
    join public.simulados s on s.id = a.simulado_id
    where a.status = 'completed' and s.kind = 'oficial'
      and (
        p_category = 'geral'
        or (p_category = 'enem' and s.exam_slug = 'enem')
        or (p_category = 'fuvest' and s.exam_slug = 'fuvest')
        or (p_category = 'unicamp' and s.exam_slug = 'unicamp')
        or (p_category = 'medicina' and s.exam_slug in ('famerp','einstein','santacasa','slmandic'))
      )
    group by a.user_id
  )
  select row_number() over (order by c.best_percent desc, c.attempts desc) as rank_position,
         c.user_id, p.username, p.full_name, p.avatar_url,
         round(c.best_percent) as best_percent, c.attempts
  from cat c
  join public.profiles p on p.id = c.user_id
  order by c.best_percent desc, c.attempts desc
  limit greatest(1, p_limit);
$$;
grant execute on function public.get_simulado_ranking(text, integer) to anon, authenticated;

-- ---------------- SEED: 9 provas oficiais (estrutura + questões representativas) ----------------
-- Estrutura oficial aproximada e CONFIGURÁVEL no admin. duration_minutes dirige o cronômetro.
insert into public.simulados
  (title, description, vestibular, faculty, duration_minutes, official_minutes, official_questions,
   difficulty, subjects, question_count, status, kind, exam_slug, exam_day, plan_required, official_subjects, rules)
select v.title, v.description, v.vestibular, v.faculty, v.dur, v.dur, v.qn,
       'difícil', v.subjects, 0, 'published', 'oficial', v.slug, v.day, v.plan, to_jsonb(v.subjects), v.rules
from (values
  ('Simulado Oficial ENEM — 1º dia', 'Reprodução do 1º dia do ENEM: Linguagens e Ciências Humanas.', 'ENEM', 'Geral', 330, 90, 'enem', 1, 'premium', array['Linguagens','Ciências Humanas'], 'Linguagens (45) + Humanas (45). 5h30 de prova.'),
  ('Simulado Oficial ENEM — 2º dia', 'Reprodução do 2º dia do ENEM: Matemática e Ciências da Natureza.', 'ENEM', 'Geral', 300, 90, 'enem', 2, 'premium', array['Matemática','Ciências da Natureza'], 'Matemática (45) + Natureza (45). 5h de prova.'),
  ('Simulado Oficial FUVEST — 1ª fase', 'Reprodução da 1ª fase da FUVEST (USP).', 'FUVEST', 'USP', 300, 90, 'fuvest', null, 'premium', array['Biologia','Química','Física','Matemática','Linguagens','Humanas'], '90 questões. Tempo oficial.'),
  ('Simulado Oficial UNICAMP — 1ª fase', 'Reprodução da 1ª fase da UNICAMP (Comvest).', 'UNICAMP', 'UNICAMP', 300, 72, 'unicamp', null, 'premium', array['Biologia','Química','Física','Matemática','Linguagens','Humanas'], '72 questões. Tempo oficial.'),
  ('Simulado Oficial UNESP', 'Reprodução da prova da UNESP (VUNESP).', 'UNESP', 'UNESP', 240, 90, 'unesp', null, 'premium', array['Biologia','Química','Física','Matemática','Linguagens','Humanas'], 'Estrutura e tempo oficiais.'),
  ('Simulado Oficial UFSC', 'Reprodução da prova da UFSC.', 'UFSC', 'UFSC', 240, 100, 'ufsc', null, 'premium', array['Biologia','Química','Física','Matemática','Linguagens','Humanas'], 'Estrutura e tempo oficiais.'),
  ('Simulado Oficial FAMERP', 'Reprodução da prova da FAMERP (Medicina).', 'FAMERP', 'FAMERP', 300, 90, 'famerp', null, 'premium_med', array['Biologia','Química','Física','Matemática','Linguagens','Humanas'], 'Estrutura e tempo oficiais.'),
  ('Simulado Oficial Albert Einstein', 'Reprodução da prova do Einstein (Medicina).', 'ALBERT EINSTEIN', 'ALBERT EINSTEIN', 240, 60, 'einstein', null, 'premium_med', array['Biologia','Química','Física','Raciocínio'], 'Estrutura e tempo oficiais.'),
  ('Simulado Oficial Santa Casa', 'Reprodução da prova da Santa Casa (Medicina).', 'SANTA CASA', 'SANTA CASA', 240, 80, 'santacasa', null, 'premium_med', array['Biologia','Química','Física','Matemática','Linguagens','Humanas'], 'Estrutura e tempo oficiais.'),
  ('Simulado Oficial SLMandic', 'Reprodução da prova da SLMandic (Medicina).', 'SLMANDIC', 'SLMANDIC', 180, 60, 'slmandic', null, 'premium_med', array['Biologia','Química','Física','Linguagens'], 'Estrutura e tempo oficiais.')
) as v(title, description, vestibular, faculty, dur, qn, slug, day, plan, subjects, rules)
where not exists (select 1 from public.simulados s where s.exam_slug = v.slug and (v.day is null or s.exam_day = v.day));

-- Questões representativas (autorais) por prova oficial — só se a prova não tiver questões.
do $$
declare s record; w uuid;
begin
  for s in select id from public.simulados where kind = 'oficial' loop
    if not exists (select 1 from public.simulado_questions where simulado_id = s.id) then
      insert into public.simulado_questions (simulado_id, subject, question_text, alternatives, correct_answer, explanation, difficulty, order_index) values
      (s.id, 'Matemática', 'Se f(x) = 2x + 3, qual o valor de f(5)?',
       '{"A":"10","B":"11","C":"13","D":"15","E":"8"}'::jsonb, 'C', 'f(5) = 2*5 + 3 = 13.', 'fácil', 1),
      (s.id, 'Biologia', 'Qual organela é responsável pela respiração celular?',
       '{"A":"Ribossomo","B":"Mitocôndria","C":"Lisossomo","D":"Complexo de Golgi","E":"Núcleo"}'::jsonb, 'B', 'A mitocôndria realiza a respiração celular e produz ATP.', 'médio', 2),
      (s.id, 'Química', 'Qual é o número atômico do carbono?',
       '{"A":"6","B":"12","C":"8","D":"14","E":"4"}'::jsonb, 'A', 'O carbono tem 6 prótons, logo número atômico 6.', 'fácil', 3),
      (s.id, 'Física', 'Um corpo em MRU percorre 100 m em 20 s. Qual a velocidade média?',
       '{"A":"2 m/s","B":"10 m/s","C":"5 m/s","D":"20 m/s","E":"50 m/s"}'::jsonb, 'C', 'v = 100/20 = 5 m/s.', 'médio', 4),
      (s.id, 'Linguagens', 'Na frase "Os alunos estudaram muito", o sujeito é:',
       '{"A":"estudaram","B":"muito","C":"Os alunos","D":"oração sem sujeito","E":"sujeito indeterminado"}'::jsonb, 'C', 'O sujeito é "Os alunos" (quem praticou a ação).', 'fácil', 5);
    end if;
  end loop;
end $$;

-- Sincroniza question_count das provas oficiais.
update public.simulados s
  set question_count = (select count(*) from public.simulado_questions q where q.simulado_id = s.id)
  where s.kind = 'oficial';

-- ---------------- Verificação ----------------
select 'simulados.kind' as item,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='simulados' and column_name='kind') as ok
union all select 'attempts.draft_answers',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='simulado_attempts' and column_name='draft_answers')
union all select 'autosave_attempt',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='autosave_attempt')
union all select 'get_simulado_ranking',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_simulado_ranking')
union all select 'provas_oficiais_seed',
  (select count(*) >= 9 from public.simulados where kind='oficial');
