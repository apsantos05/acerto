-- =====================================================================
-- ACERTE — Correção do slug nos lookups (vestibulares / faculties)
-- Rode no Supabase: SQL Editor. Idempotente.
--
-- Causa: faculties.slug (e vestibulares.slug) são NOT NULL, mas o
-- find-or-create do upload inseria só `name`. O código já passou a enviar
-- `slug`; este SQL é defensivo: backfilla slugs nulos de linhas antigas e
-- torna opcionais colunas que o app não coleta (faculties.type/state),
-- evitando novos NOT NULL inesperados no insert.
-- =====================================================================

-- Backfill de slugs nulos (linhas legadas), derivando do name
update public.faculties
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

update public.vestibulares
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

-- Tornar opcionais colunas de faculties que o app não preenche
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
end;
$$;

-- Verificação: nenhum slug nulo deve restar
select 'faculties slug nulos'   as item, count(*) as restantes from public.faculties   where slug is null or slug=''
union all
select 'vestibulares slug nulos',        count(*)              from public.vestibulares where slug is null or slug='';
