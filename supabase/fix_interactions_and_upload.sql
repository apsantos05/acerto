-- =====================================================================
-- ACERTE — Correção: curtidas (ON CONFLICT) + upload de material
-- Rode no Supabase: SQL Editor. Idempotente.
--
-- Erro 1 (curtir): "there is no unique or exclusion constraint matching the
--   ON CONFLICT specification" — o código faz upsert em likes com
--   onConflict (target_type, target_id, user_id), mas a tabela antiga não
--   tem essa unique. Além disso as colunas legadas post_id/material_id podem
--   ser NOT NULL e bloquear o insert polimórfico (que não as envia).
--
-- Erro 2 (upload): o código faz find-or-create em vestibulares/faculties
--   (INSERT), mas essas tabelas não têm policy de INSERT -> RLS bloqueia.
-- =====================================================================

-- ---------------------------------------------------------------------
-- LIKES: estrutura polimórfica + unique para o ON CONFLICT do código
-- ---------------------------------------------------------------------
alter table public.likes add column if not exists target_type text;
alter table public.likes add column if not exists target_id   uuid;

-- Backfill a partir das colunas legadas (se existirem)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='likes' and column_name='post_id') then
    update public.likes set target_type='post', target_id=post_id
    where target_id is null and post_id is not null;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='likes' and column_name='material_id') then
    update public.likes set target_type='material', target_id=material_id
    where target_id is null and material_id is not null;
  end if;
end;
$$;

-- Remove constraints antigas (PK/unique) que envolvam colunas legadas e
-- impediriam o insert polimórfico ou o novo unique. (likes é de baixo volume.)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.likes'::regclass and contype in ('p','u')
  loop
    execute format('alter table public.likes drop constraint %I', c.conname);
  end loop;
end;
$$;

-- Colunas legadas deixam de ser obrigatórias (o código não as envia mais)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='likes' and column_name='post_id' and is_nullable='NO') then
    alter table public.likes alter column post_id drop not null;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='likes' and column_name='material_id' and is_nullable='NO') then
    alter table public.likes alter column material_id drop not null;
  end if;
end;
$$;

-- Limpa linhas não migráveis e duplicatas antes do unique
delete from public.likes where target_type is null or target_id is null;
delete from public.likes a using public.likes b
  where a.ctid < b.ctid
    and a.target_type = b.target_type
    and a.target_id   = b.target_id
    and a.user_id     = b.user_id;

alter table public.likes alter column target_type set not null;
alter table public.likes alter column target_id   set not null;

-- A unique que o onConflict do código precisa
alter table public.likes
  add constraint likes_target_user_key unique (target_type, target_id, user_id);

-- ---------------------------------------------------------------------
-- SAVED_POSTS / SAVED_MATERIALS: garantir unique para o upsert
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.saved_posts'::regclass and contype in ('p','u')
      and conkey @> array[
        (select attnum from pg_attribute where attrelid='public.saved_posts'::regclass and attname='post_id'),
        (select attnum from pg_attribute where attrelid='public.saved_posts'::regclass and attname='user_id')
      ]::smallint[]
  ) then
    alter table public.saved_posts add constraint saved_posts_post_user_key unique (post_id, user_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid='public.saved_materials'::regclass and contype in ('p','u')
      and conkey @> array[
        (select attnum from pg_attribute where attrelid='public.saved_materials'::regclass and attname='user_id'),
        (select attnum from pg_attribute where attrelid='public.saved_materials'::regclass and attname='material_id')
      ]::smallint[]
  ) then
    alter table public.saved_materials add constraint saved_materials_user_material_key unique (user_id, material_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- VESTIBULARES / FACULTIES: leitura pública + INSERT por autenticado
-- (o upload faz find-or-create nessas tabelas)
-- ---------------------------------------------------------------------
alter table public.vestibulares enable row level security;
drop policy if exists vestibulares_select_public on public.vestibulares;
create policy vestibulares_select_public on public.vestibulares for select using (true);
drop policy if exists vestibulares_insert_auth on public.vestibulares;
create policy vestibulares_insert_auth on public.vestibulares for insert
  with check (auth.uid() is not null);

alter table public.faculties enable row level security;
drop policy if exists faculties_select_public on public.faculties;
create policy faculties_select_public on public.faculties for select using (true);
drop policy if exists faculties_insert_auth on public.faculties;
create policy faculties_insert_auth on public.faculties for insert
  with check (auth.uid() is not null);

-- ---------------------------------------------------------------------
-- Reafirma policies de likes/saves (caso o fix anterior não tenha rodado)
-- ---------------------------------------------------------------------
alter table public.likes enable row level security;
drop policy if exists likes_select_all on public.likes;
create policy likes_select_all on public.likes for select using (true);
drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists likes_update_own on public.likes;
create policy likes_update_own on public.likes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Verificação
-- ---------------------------------------------------------------------
select 'likes unique (target_type,target_id,user_id)' as item,
  exists (
    select 1 from pg_constraint
    where conrelid='public.likes'::regclass and contype='u' and conname='likes_target_user_key'
  ) as ok
union all
select 'vestibulares insert policy',
  exists (select 1 from pg_policies where schemaname='public' and tablename='vestibulares' and cmd='INSERT')
union all
select 'faculties insert policy',
  exists (select 1 from pg_policies where schemaname='public' and tablename='faculties' and cmd='INSERT');
