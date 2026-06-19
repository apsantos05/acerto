-- =====================================================================
-- ACERTE — Ingestão de materiais (pipeline do Telegram/local)
-- Campos de classificação rica, dedup por hash, slug e coleções por
-- universidade. Rode no Supabase: SQL Editor.
--
-- IDEMPOTENTE e compatível com o banco REAL, onde:
--   - faculties / vestibulares têm `slug` NOT NULL (coluna normal, não gerada);
--   - faculties tem colunas extras `type` e `state`;
--   - NÃO há unique constraint em `name` (por isso usamos WHERE NOT EXISTS,
--     nunca ON CONFLICT (name)).
-- Pré-requisito: schema.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Novas colunas em materials (idempotente)
-- ---------------------------------------------------------------------
alter table public.materials
  add column if not exists editora text,
  add column if not exists priority text not null default 'normal',
  add column if not exists difficulty text,
  add column if not exists file_hash text,
  add column if not exists slug text,
  add column if not exists keywords text[] not null default '{}';

-- Colunas que a ingestão/upload usam — garantidas de forma defensiva.
alter table public.materials
  add column if not exists faculdade text,
  add column if not exists vestibular text,
  add column if not exists faculty_id uuid,
  add column if not exists vestibular_id uuid;

create unique index if not exists materials_file_hash_key
  on public.materials (file_hash)
  where file_hash is not null;

create index if not exists materials_slug_idx on public.materials (slug);
create index if not exists materials_faculdade_idx on public.materials (faculdade);
create index if not exists materials_priority_idx on public.materials (priority);

-- ---------------------------------------------------------------------
-- 2) Tipos de material e prioridade (idempotente)
-- ---------------------------------------------------------------------
alter table public.materials drop constraint if exists materials_material_type_check;
alter table public.materials
  add constraint materials_material_type_check
  check (
    material_type in (
      'Apostila', 'Material teórico', 'Resumo', 'Revisão', 'Mapa mental',
      'Lista de exercícios', 'Lista de exercicios', 'Caderno de questões',
      'Questões discursivas', 'Questões objetivas', 'Simulado', 'Prova',
      'Gabarito', 'Correção comentada', 'Redação', 'Discursiva', 'Edital',
      'Leitura'
    )
  ) not valid;

alter table public.materials drop constraint if exists materials_priority_check;
alter table public.materials
  add constraint materials_priority_check
  check (priority in ('alta', 'normal')) not valid;

-- ---------------------------------------------------------------------
-- 3) Lookups (faculties / vestibulares): garante slug e seeds com slug.
--    Espelha supabase/fix_lookup_slug.sql para ser auto-suficiente.
-- ---------------------------------------------------------------------

-- 3a. Garante a coluna slug e torna type/state opcionais (faculties).
alter table public.faculties add column if not exists slug text;
alter table public.faculties add column if not exists type text;
alter table public.faculties add column if not exists state text;
alter table public.vestibulares add column if not exists slug text;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='faculties'
               and column_name='type' and is_nullable='NO') then
    alter table public.faculties alter column type drop not null;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='faculties'
               and column_name='state' and is_nullable='NO') then
    alter table public.faculties alter column state drop not null;
  end if;
end $$;

-- 3b. Backfill de slugs nulos em linhas legadas (derivando do name).
update public.faculties
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

update public.vestibulares
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

-- 3c. Índice único de slug — só cria se não houver slugs duplicados.
do $$
begin
  if not exists (select slug from public.faculties group by slug having count(*) > 1) then
    create unique index if not exists faculties_slug_key on public.faculties (slug);
  else
    raise notice 'faculties: ha slugs duplicados, indice unico nao criado (revise manualmente).';
  end if;

  if not exists (select slug from public.vestibulares group by slug having count(*) > 1) then
    create unique index if not exists vestibulares_slug_key on public.vestibulares (slug);
  else
    raise notice 'vestibulares: ha slugs duplicados, indice unico nao criado (revise manualmente).';
  end if;
end $$;

-- 3d. Seed das universidades prioritárias (com slug/type/state),
--     dedup por slug via WHERE NOT EXISTS (nunca ON CONFLICT (name)).
insert into public.faculties (name, slug, type, state)
select v.name, v.slug, v.type, v.state
from (values
  ('USP', 'usp', 'publica', 'SP'),
  ('UNICAMP', 'unicamp', 'publica', 'SP'),
  ('UNESP', 'unesp', 'publica', 'SP'),
  ('UFMG', 'ufmg', 'publica', 'MG'),
  ('UNIFESP', 'unifesp', 'publica', 'SP'),
  ('FAMERP', 'famerp', 'publica', 'SP'),
  ('FAMEMA', 'famema', 'publica', 'SP'),
  ('UFRJ', 'ufrj', 'publica', 'RJ'),
  ('UFSCAR', 'ufscar', 'publica', 'SP'),
  ('UFSC', 'ufsc', 'publica', 'SC'),
  ('UFPR', 'ufpr', 'publica', 'PR'),
  ('PUC', 'puc', 'privada', 'BR'),
  ('PUC-SP', 'puc-sp', 'privada', 'SP'),
  ('ALBERT EINSTEIN', 'albert-einstein', 'privada', 'SP'),
  ('SANTA CASA', 'santa-casa', 'privada', 'SP'),
  ('SLMANDIC', 'slmandic', 'privada', 'SP'),
  ('ENEM / SISU', 'enem-sisu', 'publica', 'BR')
) as v(name, slug, type, state)
where not exists (
  select 1 from public.faculties f where f.slug = v.slug
);

-- 3e. Seed dos vestibulares COM slug (corrige o ERROR 23502 anterior).
insert into public.vestibulares (name, slug)
select v.name, v.slug
from (values
  ('FUVEST', 'fuvest'),
  ('UNICAMP', 'unicamp'),
  ('UNESP', 'unesp'),
  ('UFMG', 'ufmg'),
  ('UNIFESP', 'unifesp'),
  ('FAMERP', 'famerp'),
  ('FAMEMA', 'famema'),
  ('UFRJ', 'ufrj'),
  ('UFSCAR', 'ufscar'),
  ('UFSC', 'ufsc'),
  ('UFPR', 'ufpr'),
  ('PUC', 'puc'),
  ('PUC-SP', 'puc-sp'),
  ('ALBERT EINSTEIN', 'albert-einstein'),
  ('SANTA CASA', 'santa-casa'),
  ('MANDIC', 'mandic'),
  ('ENEM', 'enem')
) as v(name, slug)
where not exists (
  select 1 from public.vestibulares ve where ve.slug = v.slug
);

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
select 'faculties sem slug (deve ser 0)',
  (select count(*) = 0 from public.faculties where slug is null or slug = '')
union all
select 'vestibulares sem slug (deve ser 0)',
  (select count(*) = 0 from public.vestibulares where slug is null or slug = '')
union all
select 'faculties prioritárias (>=15)',
  (select count(*) >= 15 from public.faculties);
