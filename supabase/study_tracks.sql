-- =====================================================================
-- ACERTE - Trilhas de estudo (study_tracks) + cronograma + progresso
-- Rode no Supabase: SQL Editor. Idempotente. Pode rodar mais de uma vez.
-- Pre-requisitos: schema.sql (profiles), plans_fixed.sql (plan),
-- admin_role.sql (is_admin()). materials/simulados sao opcionais.
--
-- Estrutura:
--   study_tracks        -> trilha por universidade/vestibular
--   study_track_weeks   -> semanas do cronograma
--   study_track_tasks   -> tarefas de cada semana
--   user_track_progress -> progresso do aluno
--
-- Importante: este seed usa upsert e seed_key. Ele nao deleta semanas,
-- tarefas ou progresso salvo pelos usuarios.
-- =====================================================================

-- ---------------- Tabelas ----------------
create table if not exists public.study_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  university text not null default '',
  vestibular text not null default '',
  description text not null default '',
  difficulty text not null default 'medio',
  target_course text not null default 'Medicina',
  priority_subjects text[] not null default '{}',
  is_premium boolean not null default true,
  plan_required text not null default 'premium',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  seed_key text,
  created_at timestamptz not null default now()
);

alter table public.study_track_tasks add column if not exists seed_key text;

create table if not exists public.user_track_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.study_tracks(id) on delete cascade,
  task_id uuid not null references public.study_track_tasks(id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, task_id)
);

create index if not exists study_track_weeks_track_idx
  on public.study_track_weeks(track_id);
create index if not exists study_track_tasks_week_idx
  on public.study_track_tasks(week_id);
create index if not exists user_track_progress_user_track_idx
  on public.user_track_progress(user_id, track_id);
create unique index if not exists study_track_tasks_seed_key_idx
  on public.study_track_tasks(seed_key)
  where seed_key is not null;

-- updated_at automatico em study_tracks, quando touch_updated_at existir.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'touch_updated_at'
  ) then
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

drop policy if exists study_tracks_select_public on public.study_tracks;
create policy study_tracks_select_public
  on public.study_tracks for select
  using (true);

drop policy if exists study_track_weeks_select_public on public.study_track_weeks;
create policy study_track_weeks_select_public
  on public.study_track_weeks for select
  using (true);

drop policy if exists study_track_tasks_select_public on public.study_track_tasks;
create policy study_track_tasks_select_public
  on public.study_track_tasks for select
  using (true);

drop policy if exists study_tracks_admin_write on public.study_tracks;
create policy study_tracks_admin_write
  on public.study_tracks for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists study_track_weeks_admin_write on public.study_track_weeks;
create policy study_track_weeks_admin_write
  on public.study_track_weeks for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists study_track_tasks_admin_write on public.study_track_tasks;
create policy study_track_tasks_admin_write
  on public.study_track_tasks for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists user_track_progress_select_own on public.user_track_progress;
create policy user_track_progress_select_own
  on public.user_track_progress for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists user_track_progress_insert_own on public.user_track_progress;
create policy user_track_progress_insert_own
  on public.user_track_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists user_track_progress_delete_own on public.user_track_progress;
create policy user_track_progress_delete_own
  on public.user_track_progress for delete
  using (auth.uid() = user_id);

-- ---------------- RPC: resetar progresso de uma trilha ----------------
create or replace function public.reset_track_progress(p_track_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'E preciso estar logado.' using errcode = '42501';
  end if;

  delete from public.user_track_progress
  where user_id = auth.uid() and track_id = p_track_id;
end;
$$;

grant execute on function public.reset_track_progress(uuid) to authenticated;

-- ---------------- Seed: 8 trilhas reais de Medicina ----------------
insert into public.study_tracks (
  slug,
  title,
  university,
  vestibular,
  description,
  difficulty,
  plan_required,
  is_premium,
  priority_subjects
)
select
  v.slug,
  v.title,
  v.university,
  v.vestibular,
  v.description,
  v.difficulty,
  v.plan_required,
  true,
  v.subjects
from (values
  (
    'medicina-usp-fuvest',
    'Medicina USP / FUVEST',
    'USP',
    'FUVEST',
    'Cronograma de 24 semanas para Medicina USP pela FUVEST, combinando base forte, segunda fase, redacao dissertativa e simulados progressivos.',
    'dificil',
    'premium',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  ),
  (
    'medicina-unicamp-comvest',
    'Medicina UNICAMP / COMVEST',
    'UNICAMP',
    'UNICAMP',
    'Cronograma de 24 semanas para Medicina Unicamp, com interdisciplinaridade, questoes dissertativas e redacao no padrao Comvest.',
    'dificil',
    'premium',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  ),
  (
    'medicina-unesp',
    'Medicina UNESP',
    'UNESP',
    'UNESP',
    'Cronograma de 24 semanas para Medicina UNESP/VUNESP, com natureza, matematica, leitura de enunciado e redacao semanal.',
    'dificil',
    'premium',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  ),
  (
    'medicina-ufsc',
    'Medicina UFSC',
    'UFSC',
    'UFSC',
    'Cronograma de 24 semanas para Medicina UFSC/COPERVE, com cobertura ampla, treino de prova e redacao aplicada.',
    'medio',
    'premium',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  ),
  (
    'medicina-famerp',
    'Medicina FAMERP',
    'FAMERP',
    'FAMERP',
    'Cronograma de 24 semanas para Medicina FAMERP, com foco em alta concorrencia, discursivas, natureza e redacao.',
    'dificil',
    'premium_med',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  ),
  (
    'medicina-einstein',
    'Medicina Albert Einstein',
    'ALBERT EINSTEIN',
    'ALBERT EINSTEIN',
    'Cronograma de 24 semanas para Medicina Einstein, com prova propria, interpretacao cientifica, natureza e redacao.',
    'dificil',
    'premium_med',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  ),
  (
    'medicina-santa-casa',
    'Medicina Santa Casa SP',
    'SANTA CASA',
    'SANTA CASA',
    'Cronograma de 24 semanas para Medicina Santa Casa SP, com ciencias da natureza, leitura critica e redacao.',
    'dificil',
    'premium_med',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  ),
  (
    'medicina-slmandic',
    'Medicina SLMandic',
    'SLMANDIC',
    'MANDIC',
    'Cronograma de 24 semanas para Medicina SLMandic, com prova propria, revisao dirigida, simulados e redacao.',
    'medio',
    'premium_med',
    array['Biologia','Quimica','Fisica','Matematica','Redacao']
  )
) as v(slug, title, university, vestibular, description, difficulty, plan_required, subjects)
on conflict (slug) do update
set title = excluded.title,
    university = excluded.university,
    vestibular = excluded.vestibular,
    description = excluded.description,
    difficulty = excluded.difficulty,
    plan_required = excluded.plan_required,
    is_premium = excluded.is_premium,
    priority_subjects = excluded.priority_subjects,
    target_course = 'Medicina',
    status = 'active',
    updated_at = now();

-- Vincula tarefas antigas ao seed novo quando possivel, preservando IDs usados
-- em user_track_progress. Tarefas extras do usuario/admin nao sao removidas.
with ranked_seed_tasks as (
  select
    task.id,
    format('seed:%s:%s:%s', track.slug, week.week_number, task.order_index) as next_seed_key,
    row_number() over (
      partition by track.slug, week.week_number, task.order_index
      order by task.created_at, task.id
    ) as rn
  from public.study_track_tasks task
  join public.study_track_weeks week on week.id = task.week_id
  join public.study_tracks track on track.id = week.track_id
  where track.slug in (
    'medicina-usp-fuvest',
    'medicina-unicamp-comvest',
    'medicina-unesp',
    'medicina-ufsc',
    'medicina-famerp',
    'medicina-einstein',
    'medicina-santa-casa',
    'medicina-slmandic'
  )
    and task.seed_key is null
    and task.order_index between 1 and 5
)
update public.study_track_tasks task
set seed_key = ranked.next_seed_key
from ranked_seed_tasks ranked
where task.id = ranked.id
  and ranked.rn = 1
  and not exists (
    select 1
    from public.study_track_tasks existing
    where existing.seed_key = ranked.next_seed_key
  );

-- ---------------- Seed: cronograma de aprovacao (24 semanas) ----------------
-- Cada semana possui material, exercicios, revisao, simulado e redacao.
-- seed_key permite reexecutar sem duplicar tarefas e sem apagar progresso.
do $$
declare
  t record;
  w record;
  v_week_id uuid;
begin
  for t in
    select *
    from public.study_tracks
    where slug in (
      'medicina-usp-fuvest',
      'medicina-unicamp-comvest',
      'medicina-unesp',
      'medicina-ufsc',
      'medicina-famerp',
      'medicina-einstein',
      'medicina-santa-casa',
      'medicina-slmandic'
    )
  loop
    for w in
      select *
      from (values
        (1,  'Diagnostico e leitura da banca', 'Mapear prova, pesos, rotina semanal e lacunas iniciais.', 'diagnostico de prova, edital e conteudos de maior incidencia', 'questoes diagnosticas por materia', 'caderno de erros inicial', 'mini-simulado diagnostico', 'redacao diagnostica com tese e repertorio'),
        (2,  'Citologia e quimica quantitativa', 'Construir base em celula, bioquimica, estequiometria e funcoes.', 'citologia, membranas, organelas, estequiometria e funcoes', 'exercicios de calculo quimico e interpretacao celular', 'flashcards de organelas e formulas', 'bloco cronometrado de natureza', 'introducao e projeto de texto'),
        (3,  'Genetica, solucoes e cinematica', 'Aprofundar genetica mendeliana, solucoes e movimento.', 'genetica, heredogramas, solucoes e cinematica', 'listas de genetica, concentracao e graficos de movimento', 'revisao ativa de erros da semana 2', 'simulado curto de biologia/quimica/fisica', 'desenvolvimento de argumento'),
        (4,  'Ecologia, ligacoes e dinamica', 'Conectar ecologia, ligacoes quimicas e leis de Newton.', 'ecologia, ciclos biogeoquimicos, ligacoes quimicas e dinamica', 'questoes contextualizadas da banca', 'mapa mental de ecologia e forcas', 'simulado de primeira fase por tempo', 'redacao com repertorio socioambiental'),
        (5,  'Fisiologia, termoquimica e energia', 'Entrar em sistemas humanos, energia quimica e energia mecanica.', 'fisiologia humana, termoquimica, trabalho e energia', 'exercicios de sistemas, entalpia e conservacao de energia', 'revisao espacada das semanas 1 a 4', 'simulado de natureza com correcao detalhada', 'redacao sobre saude publica'),
        (6,  'Marco 25% - revisao e simulado parcial', 'Consolidar o primeiro quarto da trilha com prova parcial.', 'resumos de maior incidencia do primeiro ciclo', 'lista mista de citologia, genetica, quimica e fisica', 'revisao 25% com caderno de erros', 'simulado parcial 25%', 'reescrita da melhor redacao do ciclo'),
        (7,  'Fisico-quimica e probabilidade', 'Treinar equilibrio, eletroquimica, probabilidade e leitura de graficos.', 'equilibrio quimico, eletroquimica, probabilidade e estatistica', 'questoes quantitativas em blocos curtos', 'formulas e gatilhos de resolucao', 'simulado de exatas com tempo reduzido', 'redacao com dados estatisticos'),
        (8,  'Organica e ondas', 'Dominar funcoes organicas, isomeria, ondas e optica inicial.', 'organica, isomeria, ondas, optica e interpretacao experimental', 'exercicios de reacoes, espectros e fenomenos ondulatorios', 'quadro comparativo de funcoes organicas', 'simulado tematico de organica e fisica', 'proposta de redacao sobre tecnologia e saude'),
        (9,  'Botanica, zoologia e geometria', 'Cobrir diversidade biologica e geometria plana/espacial.', 'botanica, zoologia, geometria plana e espacial', 'questoes de classificacao, anatomia vegetal e geometria', 'revisao por desenho e esquemas', 'simulado interdisciplinar de natureza e matematica', 'redacao com recorte educacional/cientifico'),
        (10, 'Termologia, optica e combinatoria', 'Treinar temas recorrentes de fisica e matematica combinatoria.', 'termologia, optica, analise combinatoria e probabilidade aplicada', 'listas com problemas de multiplas etapas', 'revisao de formulas e unidades', 'simulado cronometrado de exatas', 'redacao com contra-argumentacao'),
        (11, 'Humanas e leitura critica', 'Aprimorar leitura, atualidades e repertorio para redacao.', 'interpretacao de texto, humanas, atualidades e repertorio', 'questoes de leitura critica e graficos sociais', 'revisao de temas de redacao recorrentes', 'simulado de linguagens/humanas', 'redacao completa com foco em coesao'),
        (12, 'Marco 50% - simulado de meio ciclo', 'Medir metade do cronograma e corrigir prioridades.', 'sintese das semanas 1 a 11', 'lista de erros frequentes e exercicios de recuperacao', 'revisao 50% com priorizacao por desempenho', 'simulado de meio ciclo', 'redacao corrigida e reescrita obrigatoria'),
        (13, 'Biologia molecular e genetica avancada', 'Voltar a biologia de alto peso com questoes mais dificeis.', 'DNA, RNA, sintese proteica, biotecnologia e genetica avancada', 'exercicios dissertativos e objetivos de genetica', 'tabela de herancas e biotecnologia', 'simulado de biologia avancada', 'redacao sobre bioetica'),
        (14, 'Quimica organica aplicada', 'Consolidar reacoes organicas, polimeros, bioquimica e ambiente.', 'reacoes organicas, polimeros, biomoleculas e quimica ambiental', 'questoes de mecanismos e aplicacoes medicas', 'revisao de funcoes e reatividade', 'simulado de quimica organica', 'redacao sobre consumo, ciencia e sustentabilidade'),
        (15, 'Fisica moderna e eletricidade', 'Trabalhar eletricidade, magnetismo e fisica moderna aplicada.', 'eletricidade, circuitos, magnetismo e fisica moderna', 'listas de circuitos, graficos e fenomenos modernos', 'resumo de grandezas eletricas', 'simulado de fisica aplicada', 'redacao com repertorio tecnologico'),
        (16, 'Matematica de prova', 'Refinar funcoes, geometria analitica, PA/PG e estatistica.', 'funcoes, geometria analitica, sequencias e estatistica', 'bateria de matematica com correcao por metodo', 'revisao de atalhos e armadilhas', 'simulado de matematica por tempo', 'redacao com repertorio economico/social'),
        (17, 'Saude publica e fisiologia integrada', 'Unir sistemas humanos, imunologia, parasitologia e epidemiologia.', 'fisiologia integrada, imunologia, parasitologia e saude publica', 'questoes contextualizadas em medicina e sociedade', 'mapa de doencas, vetores e prevencao', 'simulado de biologia medica', 'redacao sobre SUS, prevencao e desigualdade'),
        (18, 'Marco 75% - prova integrada', 'Executar prova integrada e fechar lacunas fortes.', 'revisao de alta incidencia ate 75%', 'lista mista dos principais erros', 'revisao 75% com plano de recuperacao', 'prova integrada 75%', 'redacao completa em condicao de prova'),
        (19, 'Discursivas e segunda fase', 'Treinar resposta escrita, justificativa e resolucao organizada.', 'questoes discursivas, segunda fase e resolucao passo a passo', 'exercicios dissertativos por materia', 'checklist de resposta completa', 'simulado discursivo parcial', 'redacao com foco em precisao argumentativa'),
        (20, 'Redacao de alta performance', 'Elevar consistencia textual e repertorio autoral.', 'competencias de redacao, repertorio e projeto de intervencao quando aplicavel', 'exercicios de tese, topico frasal e conclusao', 'banco de repertorios por eixo tematico', 'simulado leve para manter ritmo', 'duas redacoes na semana com reescrita'),
        (21, 'Correcao fina do caderno de erros', 'Transformar erros recorrentes em revisao objetiva.', 'topicos fracos identificados nos simulados anteriores', 'listas personalizadas de recuperacao', 'revisao 80/20 por incidencia e erro', 'simulado focado nas lacunas', 'redacao com tema surpresa'),
        (22, 'Sequencia de simulados e gestao de tempo', 'Treinar resistencia, ordem de prova e tomada de decisao.', 'estrategia de prova, marcacao, tempo e revisao final', 'exercicios curtos de manutencao', 'revisao de formulas, mapas e repertorios', 'simulado completo 1', 'redacao em tempo oficial'),
        (23, 'Reta final por incidencia', 'Priorizar o que mais cai e reduzir risco de esquecimento.', 'assuntos de maior incidencia da banca e temas provaveis', 'lista final por materia', 'revisao final de caderno de erros', 'simulado completo 2', 'redacao com revisao de repertorios'),
        (24, 'Marco 100% - simulado final e plano de prova', 'Concluir a trilha com simulado final e plano pessoal de prova.', 'sintese completa da trilha e checklist da vespera', 'exercicios de manutencao sem sobrecarga', 'revisao 100% e plano de vespera', 'simulado final 100%', 'redacao final e leitura critica da propria evolucao')
      ) as w(week_number, title, description, material_focus, exercise_focus, review_focus, simulado_focus, essay_focus)
    loop
      insert into public.study_track_weeks (track_id, week_number, title, description)
      values (t.id, w.week_number, w.title, w.description)
      on conflict (track_id, week_number) do update
      set title = excluded.title,
          description = excluded.description
      returning id into v_week_id;

      insert into public.study_track_tasks
        (week_id, subject, title, description, estimated_minutes, order_index, seed_key)
      values
        (v_week_id, 'Materiais', 'Estudar materiais - ' || w.material_focus,
         'Ler materiais aprovados e anotar padroes de cobranca de ' || t.vestibular || ' para ' || t.university || '.', 75, 1,
         format('seed:%s:%s:%s', t.slug, w.week_number, 1)),
        (v_week_id, 'Exercicios', 'Resolver exercicios - ' || w.exercise_focus,
         'Resolver questoes em blocos, corrigir por alternativa e registrar erros recorrentes.', 90, 2,
         format('seed:%s:%s:%s', t.slug, w.week_number, 2)),
        (v_week_id, 'Revisao', 'Revisar - ' || w.review_focus,
         'Fazer revisao ativa, flashcards e atualizacao do caderno de erros.', 45, 3,
         format('seed:%s:%s:%s', t.slug, w.week_number, 3)),
        (v_week_id, 'Simulado', 'Fazer simulado - ' || w.simulado_focus,
         'Executar treino cronometrado, corrigir desempenho e separar prioridades da semana seguinte.',
         case when w.week_number in (6, 12, 18, 22, 23, 24) then 180 else 75 end, 4,
         format('seed:%s:%s:%s', t.slug, w.week_number, 4)),
        (v_week_id, 'Redacao', 'Produzir redacao - ' || w.essay_focus,
         'Escrever, revisar e reescrever com foco na banca ' || t.vestibular || '.', 90, 5,
         format('seed:%s:%s:%s', t.slug, w.week_number, 5))
      on conflict (seed_key) where seed_key is not null do update
      set week_id = excluded.week_id,
          subject = excluded.subject,
          title = excluded.title,
          description = excluded.description,
          estimated_minutes = excluded.estimated_minutes,
          order_index = excluded.order_index;
    end loop;
  end loop;
end $$;

-- ---------------- Verificacao ----------------
select 'study_tracks_alvo' as item,
  (select count(*) from public.study_tracks where slug in (
    'medicina-usp-fuvest','medicina-unicamp-comvest','medicina-unesp','medicina-ufsc',
    'medicina-famerp','medicina-einstein','medicina-santa-casa','medicina-slmandic'
  ))::text as info
union all
select 'study_track_weeks_alvo',
  (select count(*)
   from public.study_track_weeks w
   join public.study_tracks t on t.id = w.track_id
   where t.slug in (
    'medicina-usp-fuvest','medicina-unicamp-comvest','medicina-unesp','medicina-ufsc',
    'medicina-famerp','medicina-einstein','medicina-santa-casa','medicina-slmandic'
   ))::text
union all
select 'study_track_tasks_alvo',
  (select count(*)
   from public.study_track_tasks task
   join public.study_track_weeks w on w.id = task.week_id
   join public.study_tracks t on t.id = w.track_id
   where t.slug in (
    'medicina-usp-fuvest','medicina-unicamp-comvest','medicina-unesp','medicina-ufsc',
    'medicina-famerp','medicina-einstein','medicina-santa-casa','medicina-slmandic'
   ))::text
union all
select 'reset_track_progress',
  (exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='reset_track_progress'))::text;
