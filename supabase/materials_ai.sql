-- =====================================================================
-- ACERTE — Resumo gerado por IA nos materiais
-- Coluna usada pela etapa ai-classify do pipeline do Telegram.
-- Rode no Supabase: SQL Editor. Idempotente. (Pré-req: materials_ingest.sql)
-- =====================================================================

alter table public.materials
  add column if not exists summary text;

select 'materials.summary' as item,
  exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='materials' and column_name='summary'
  ) as ok;
