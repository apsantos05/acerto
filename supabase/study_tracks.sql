-- =====================================================================
-- ACERTE — Trilhas de estudo (study_tracks) + cronograma + progresso
-- Rode no Supabase: SQL Editor. Idempotente. Pode rodar mais de uma vez.
-- Pré-requisitos: schema.sql (profiles), plans_fixed.sql (plan), admin_role.sql
-- (is_admin()). materials/simulados são referenciados de forma opcional.
--
-- Estrutura:
--   study_tracks       -> a trilha (por universidade/vestibular)
--   study_track_weeks  -> semanas do cronograma
--   study_track_tasks  -> tarefas de cada semana (matéria/tema, links opcionais)
--   user_track_progress-> progresso do aluno (1 linha por tarefa concluída)
-- Gating por plano: coluna plan_required (free | premium | premium_med).
-- =====================================================================

-- ---------------- Tabelas ----------------
create table if not exists public.study_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  university text not null default '',
  vestibular text not null default '',
  description text not null default '',
  difficulty text not null default 'médio',
  target_course text not null default 'Medicina',
  priority_subjects text[] not null default '{}',
  is_premium boolean not null default true,
  plan_required text not null default 'premium',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colunas extras idempotentes (caso a tabela já exista de versão anterior)
alter table public.study_tracks add column if not exists priority_subjects text[] not null default '{}';
alter table public.study_tracks add column if not exists target_course text not null default 'Medicina';
alter table public.study_tracks add column if not exists status text not null default 'active';

alter table public.study_tracks drop constraint if exists study_tracks_plan_required_check;
alter table public.study_tracks
  add constraint study_tracks_plan_required_check
  check (plan_required in ('free', 'premium', 'premium_med')) not valid;

alter table public.study_tracks drop constraint if exists study_tracks_status_check;
alter table public.study_tracks
  add constraint study_tracks_status_check
  check (status in ('active', 'inactive')) not valid;

create table if not exists public.study_track_weeks (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.study_tracks(id) on delete cascade,
  week_number integer not null,
  title text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  unique (track_id, week_number)
);

create table if not exists public.study_track_tasks (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.study_track_weeks(id) on delete cascade,
  subject text not null default '',
  title text not null default '',
  description text not null default '',
  material_id uuid references public.materials(id) on delete set null,
  simulado_id uuid references public.simulados(id) on delete set null,
  estimated_minutes integer not null default 60,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_track_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.study_tracks(id) on delete cascade,
  task_id uuid not null references public.study_track_tasks(id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);

create index if not exists study_track_weeks_track_idx on public.study_track_weeks(track_id);
create index if not exists study_track_tasks_week_idx on public.study_track_tasks(week_id);
create index if not exists user_track_progress_user_track_idx on public.user_track_progress(user_id, track_id);

-- updated_at automático em study_tracks (reusa touch_updated_at se existir)
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='public' and p.proname='touch_updated_at') then
    drop trigger if exists study_tracks_touch on public.study_tracks;
    create trigger study_tracks_touch before update on public.study_tracks
      for each row execute function public.touch_updated_at();
  end if;
end $$;

-- ---------------- RLS ----------------
alter table public.study_tracks enable row level security;
alter table public.study_track_weeks enable row level security;
alter table public.study_track_tasks enable row level security;
alter table public.user_track_progress enable row level security;

-- Leitura pública das trilhas/semanas/tarefas (lista e prévia abertas).
drop policy if exists study_tracks_select_public on public.study_tracks;
create policy study_tracks_select_public on public.study_tracks for select using (true);

drop policy if exists study_track_weeks_select_public on public.study_track_weeks;
create policy study_track_weeks_select_public on public.study_track_weeks for select using (true);

drop policy if exists study_track_tasks_select_public on public.study_track_tasks;
create policy study_track_tasks_select_public on public.study_track_tasks for select using (true);

-- Escrita de trilhas/semanas/tarefas: somente admin.
drop policy if exists study_tracks_admin_write on public.study_tracks;
create policy study_tracks_admin_write on public.study_tracks for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_track_weeks_admin_write on public.study_track_weeks;
create policy study_track_weeks_admin_write on public.study_track_weeks for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_track_tasks_admin_write on public.study_track_tasks;
create policy study_track_tasks_admin_write on public.study_track_tasks for all
  using (public.is_admin()) with check (public.is_admin());

-- Progresso: cada usuário só lê/altera o próprio; admin lê tudo.
drop policy if exists user_track_progress_select_own on public.user_track_progress;
create policy user_track_progress_select_own on public.user_track_progress for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists user_track_progress_insert_own on public.user_track_progress;
create policy user_track_progress_insert_own on public.user_track_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists user_track_progress_delete_own on public.user_track_progress;
create policy user_track_progress_delete_own on public.user_track_progress for delete
  using (auth.uid() = user_id);

-- ---------------- RPC: resetar progresso de uma trilha ----------------
create or replace function public.reset_track_progress(p_track_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;
  delete from public.user_track_progress
  where user_id = auth.uid() and track_id = p_track_id;
end;
$$;
grant execute on function public.reset_track_progress(uuid) to authenticated;

-- ---------------- Seed: 11 trilhas de Medicina ----------------
-- university/vestibular usam os MESMOS valores gravados em materials
-- (faculdade/vestibular), para a recomendação reusar a query da biblioteca.
insert into public.study_tracks (slug, title, university, vestibular, description, difficulty, plan_required, is_premium, priority_subjects)
select v.slug, v.title, v.university, v.vestibular, v.description, v.difficulty, v.plan_required, true, v.subjects
from (values
  ('medicina-usp-fuvest', 'Medicina USP / FUVEST', 'USP', 'FUVEST',
   'Trilha focada na aprovação em Medicina na USP pela FUVEST, com 1ª e 2ª fases, prioridade nas matérias de maior peso e redação dissertativa.',
   'difícil', 'premium', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-unicamp-comvest', 'Medicina UNICAMP / COMVEST', 'UNICAMP', 'UNICAMP',
   'Trilha para Medicina na Unicamp (Comvest): interdisciplinaridade, questões dissertativas e redação no estilo da banca.',
   'difícil', 'premium', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-unesp', 'Medicina UNESP', 'UNESP', 'UNESP',
   'Trilha para Medicina na Unesp (VUNESP): base sólida em ciências da natureza e redação.',
   'difícil', 'premium', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-famerp', 'Medicina FAMERP', 'FAMERP', 'FAMERP',
   'Trilha premium para Medicina na FAMERP, uma das faculdades de Medicina mais concorridas do interior paulista.',
   'difícil', 'premium_med', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-ufsc', 'Medicina UFSC', 'UFSC', 'UFSC',
   'Trilha para Medicina na UFSC (COPERVE): prova única, ampla cobertura de conteúdos e redação.',
   'médio', 'premium', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-ufpr', 'Medicina UFPR', 'UFPR', 'UFPR',
   'Trilha para Medicina na UFPR: fases objetiva e de conhecimento específico, com foco em ciências da natureza.',
   'médio', 'premium', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-ufmg', 'Medicina UFMG', 'UFMG', 'UFMG',
   'Trilha para Medicina na UFMG via ENEM/SISU: foco no desempenho no ENEM e na redação.',
   'médio', 'premium', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-unifesp', 'Medicina UNIFESP', 'UNIFESP', 'UNIFESP',
   'Trilha para Medicina na Unifesp: prova mista e raciocínio aplicado, com forte peso em Biologia e Química.',
   'difícil', 'premium', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-einstein', 'Medicina Albert Einstein', 'ALBERT EINSTEIN', 'ALBERT EINSTEIN',
   'Trilha premium para Medicina no Albert Einstein, referência em ensino médico, com prova própria e redação.',
   'difícil', 'premium_med', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-santa-casa', 'Medicina Santa Casa SP', 'SANTA CASA', 'SANTA CASA',
   'Trilha premium para Medicina na Santa Casa de São Paulo, com foco nas ciências da natureza e redação.',
   'difícil', 'premium_med', array['Biologia','Química','Física','Matemática','Redação']),
  ('medicina-slmandic', 'Medicina SLMandic', 'SLMANDIC', 'MANDIC',
   'Trilha premium para Medicina na SLMandic (Campinas), com prova própria e redação.',
   'médio', 'premium_med', array['Biologia','Química','Física','Matemática','Redação'])
) as v(slug, title, university, vestibular, description, difficulty, plan_required, subjects)
where not exists (select 1 from public.study_tracks t where t.slug = v.slug);

-- ---------------- Seed: cronograma (2 semanas) por trilha ----------------
-- Template baseado nas matérias prioritárias. Só insere onde ainda não há semanas.
do $$
declare
  t record;
  w1 uuid;
  w2 uuid;
begin
  for t in select id from public.study_tracks loop
    if not exists (select 1 from public.study_track_weeks where track_id = t.id) then
      insert into public.study_track_weeks (track_id, week_number, title, description)
        values (t.id, 1, 'Semana 1 — Fundamentos', 'Base dos principais conteúdos para começar com consistência.')
        returning id into w1;
      insert into public.study_track_weeks (track_id, week_number, title, description)
        values (t.id, 2, 'Semana 2 — Aprofundamento', 'Avança nos temas de maior incidência na prova.')
        returning id into w2;

      insert into public.study_track_tasks (week_id, subject, title, description, estimated_minutes, order_index) values
        (w1, 'Biologia',   'Citologia',     'Estrutura e função celular, membranas e organelas.', 60, 1),
        (w1, 'Química',    'Estequiometria','Cálculos estequiométricos e leis ponderais.',         60, 2),
        (w1, 'Física',     'Cinemática',    'Movimento uniforme e uniformemente variado.',         60, 3),
        (w1, 'Matemática', 'Funções',       'Função afim, quadrática e introdução a funções.',     60, 4),
        (w1, 'Redação',    'Introdução',    'Estrutura do texto dissertativo-argumentativo.',      45, 5);

      insert into public.study_track_tasks (week_id, subject, title, description, estimated_minutes, order_index) values
        (w2, 'Biologia',   'Genética',                  'Leis de Mendel e probabilidade genética.',        60, 1),
        (w2, 'Química',    'Soluções',                  'Concentração, diluição e propriedades coligativas.',60, 2),
        (w2, 'Física',     'Dinâmica',                  'Leis de Newton e aplicações.',                    60, 3),
        (w2, 'Matemática', 'Geometria',                 'Geometria plana e espacial.',                     60, 4),
        (w2, 'Redação',    'Competências ENEM/FUVEST',  'Critérios de correção e repertório sociocultural.',45, 5);
    end if;
  end loop;
end $$;

-- ---------------- Verificação ----------------
select 'study_tracks' as item, count(*)::text as info from public.study_tracks
union all
select 'study_track_weeks', count(*)::text from public.study_track_weeks
union all
select 'study_track_tasks', count(*)::text from public.study_track_tasks
union all
select 'reset_track_progress',
  (exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='reset_track_progress'))::text;
