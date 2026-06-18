-- =====================================================================
-- ACERTE — Amplia os tipos de material aceitos (para a importação oficial)
-- Rode no Supabase: SQL Editor. Idempotente.
-- =====================================================================

alter table public.materials drop constraint if exists materials_material_type_check;

alter table public.materials
  add constraint materials_material_type_check
  check (material_type in (
    'Prova',
    'Gabarito',
    'Discursiva',
    'Edital',
    'Leitura',
    'Simulado',
    'Resumo',
    'Lista de exercicios',
    'Lista de exercícios',
    'Mapa mental'
  )) not valid;

-- Índice único em external_url -> evita materiais duplicados na importação por link
create unique index if not exists materials_external_url_key
  on public.materials (external_url)
  where external_url is not null;

select 'check material_type' as item, true as ok
union all
select 'unique external_url',
  exists(select 1 from pg_indexes where schemaname='public' and indexname='materials_external_url_key');
