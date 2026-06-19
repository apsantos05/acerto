-- =====================================================================
-- ACERTE — Ingestão de materiais (pipeline do Telegram)
-- Campos de classificação rica, dedup por hash, slug e coleções por
-- universidade. Rode no Supabase: SQL Editor. Idempotente.
-- Pré-requisito: schema.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Novas colunas em materials
-- ---------------------------------------------------------------------
alter table public.materials
  add column if not exists editora text,            -- banca/editora (Bernoulli, COC...)
  add column if not exists priority text not null default 'normal', -- 'alta' | 'normal'
  add column if not exists difficulty text,          -- 'fácil' | 'média' | 'difícil'
  add column if not exists file_hash text,           -- sha256 do PDF (dedup)
  add column if not exists slug text,                -- slug amigável p/ busca
  add column if not exists keywords text[] not null default '{}';

-- Dedup forte: o mesmo arquivo (hash) só existe uma vez.
create unique index if not exists materials_file_hash_key
  on public.materials (file_hash)
  where file_hash is not null;

create index if not exists materials_slug_idx on public.materials (slug);
create index if not exists materials_faculdade_idx on public.materials (faculdade);
create index if not exists materials_priority_idx on public.materials (priority);

-- ---------------------------------------------------------------------
-- 2) Tipos de material — amplia o check para os tipos do pipeline
--    (mantém os antigos por compatibilidade)
-- ---------------------------------------------------------------------
alter table public.materials drop constraint if exists materials_material_type_check;
alter table public.materials
  add constraint materials_material_type_check
  check (
    material_type in (
      'Apostila',
      'Material teórico',
      'Resumo',
      'Revisão',
      'Mapa mental',
      'Lista de exercícios',
      'Lista de exercicios',
      'Caderno de questões',
      'Questões discursivas',
      'Questões objetivas',
      'Simulado',
      'Prova',
      'Gabarito',
      'Correção comentada',
      'Redação',
      'Discursiva',
      'Edital',
      'Leitura'
    )
  ) not valid;

alter table public.materials drop constraint if exists materials_priority_check;
alter table public.materials
  add constraint materials_priority_check
  check (priority in ('alta', 'normal')) not valid;

-- ---------------------------------------------------------------------
-- 3) Coleções por universidade (prioritárias) + vestibulares
--    Reaproveita faculties/vestibulares: a biblioteca já filtra por
--    faculdade (universidade) e vestibular.
-- ---------------------------------------------------------------------
insert into public.faculties (name) values
  ('USP'), ('UNICAMP'), ('UNESP'), ('UFMG'), ('UNIFESP'), ('FAMERP'),
  ('UFRJ'), ('UFSC'), ('UFPR'), ('PUC'), ('PUC-SP'), ('ALBERT EINSTEIN'),
  ('SANTA CASA'), ('SLMANDIC'), ('ENEM / SISU')
on conflict (name) do nothing;

insert into public.vestibulares (name) values
  ('FUVEST'), ('UNICAMP'), ('UNESP'), ('UFMG'), ('UNIFESP'), ('FAMERP'),
  ('UFRJ'), ('UFSC'), ('UFPR'), ('PUC-SP'), ('ALBERT EINSTEIN'),
  ('SANTA CASA'), ('MANDIC'), ('ENEM')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 4) Verificação
-- ---------------------------------------------------------------------
select 'materials.file_hash' as item,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='file_hash') as ok
union all
select 'materials.editora',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='editora')
union all
select 'materials.priority',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='priority')
union all
select 'materials.slug',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='slug')
union all
select 'materials.keywords',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='keywords')
union all
select 'unique file_hash',
  exists(select 1 from pg_indexes where schemaname='public' and indexname='materials_file_hash_key')
union all
select 'faculdades prioritárias',
  (select count(*) >= 14 from public.faculties);
