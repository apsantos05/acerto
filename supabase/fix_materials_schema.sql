-- =====================================================================
-- ACERTE — Alinhamento DEFINITIVO da tabela materials (schema antigo -> novo)
-- Rode no Supabase: SQL Editor. Idempotente. SQL único e completo.
--
-- Erro atual: null value in column "type" of relation "materials" (23502)
--   -> a tabela tem colunas LEGADAS NOT NULL (type, author_id) que o código
--      não preenche (ele usa material_type e owner_id).
--
-- Auditoria (colunas reais): id, owner_id, author_id(legado), title,
--   description, type(legado), material_type, subject, vestibular, faculdade,
--   vestibular_id, faculty_id, year, file_url, external_url, storage_path,
--   upload_kind, tags, status, rating, views_count, created_at.
--
-- Payload do código (insert):
--   owner_id, vestibular_id, faculty_id, title, description, vestibular,
--   faculdade, year, subject, material_type, file_url, external_url,
--   storage_path, upload_kind, tags, status.
--
-- Estratégia: (1) garantir colunas novas; (2) backfill dos legados;
--   (3) remover NOT NULL de TODA coluna legada/condicional que o código não
--   garante (resolve type, author_id, file_url/external_url/storage_path...).
-- =====================================================================

-- (1) Garante as colunas do schema novo (idempotente)
alter table public.materials
  add column if not exists owner_id      uuid references public.profiles(id) on delete cascade,
  add column if not exists vestibular_id uuid,
  add column if not exists faculty_id    uuid,
  add column if not exists material_type text,
  add column if not exists subject       text,
  add column if not exists vestibular    text,
  add column if not exists faculdade     text,
  add column if not exists year          integer,
  add column if not exists file_url      text,
  add column if not exists external_url  text,
  add column if not exists storage_path  text,
  add column if not exists upload_kind   text,
  add column if not exists tags          text[],
  add column if not exists status        text,
  add column if not exists rating        numeric(3, 2),
  add column if not exists views_count   integer,
  add column if not exists description   text,
  add column if not exists title         text;

-- Defaults sensatos (não quebram se já existirem)
alter table public.materials alter column status      set default 'pending';
alter table public.materials alter column upload_kind set default 'file';
alter table public.materials alter column tags        set default '{}';
alter table public.materials alter column rating       set default 0;
alter table public.materials alter column views_count  set default 0;
alter table public.materials alter column vestibular   set default 'Todos';
alter table public.materials alter column faculdade    set default 'Medicina';

-- (2) Backfill dos legados -> novos
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='materials' and column_name='author_id') then
    update public.materials set owner_id = author_id where owner_id is null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='materials' and column_name='type') then
    -- mantém o legado type preenchido a partir do material_type e vice-versa
    update public.materials set material_type = coalesce(material_type, type) where material_type is null;
    update public.materials set type = coalesce(type, material_type) where type is null;
  end if;
end;
$$;

update public.materials set material_type = coalesce(material_type, 'Resumo') where material_type is null;
update public.materials set subject       = coalesce(subject, 'Interdisciplinar') where subject is null;

-- (3) DEFINITIVO: remove NOT NULL de toda coluna NOT NULL sem default que o
--     código NÃO garante non-null no insert. Cobre type, author_id e quaisquer
--     colunas condicionais (file_url/external_url/storage_path) ou outras legadas.
do $$
declare
  r record;
  guaranteed text[] := array[
    'id','owner_id','vestibular_id','faculty_id','title','description',
    'vestibular','faculdade','year','subject','material_type',
    'upload_kind','tags','status'
  ];
begin
  for r in
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'materials'
      and is_nullable  = 'NO'
      and column_default is null
      and not (column_name = any(guaranteed))
  loop
    execute format('alter table public.materials alter column %I drop not null', r.column_name);
    raise notice 'NOT NULL removido de materials.%', r.column_name;
  end loop;
end;
$$;

-- (4) Verificação: nenhuma coluna obrigatória "surpresa" deve restar
select column_name as ainda_obrigatoria_sem_default
from information_schema.columns
where table_schema='public' and table_name='materials'
  and is_nullable='NO' and column_default is null
order by column_name;
-- Esperado: apenas colunas que o código SEMPRE envia (owner_id, title, etc.)
-- ou nenhuma. NÃO deve aparecer type, author_id, file_url, storage_path...
