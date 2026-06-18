-- =====================================================================
-- ACERTE — Migração de produção: alinhar o banco ANTIGO ao schema do código
-- Rode no Supabase: SQL Editor. Idempotente e seguro para reexecutar.
--
-- Contexto: o banco de produção está no schema antigo (materials.author_id,
-- likes com post_id/material_id, posts sem tags, profiles sem várias colunas,
-- sem saved_posts). O código (schema.sql) espera o schema novo. Esta migração
-- preenche EXATAMENTE as lacunas que o schema.sql não cobre para tabelas já
-- existentes (owner_id, material_type, points, likes polimórfico, saved_posts).
-- =====================================================================

-- ---------- PROFILES ----------
alter table public.profiles
  add column if not exists objective     text not null default 'Medicina',
  add column if not exists dream_faculty text,
  add column if not exists target_exams  text[] not null default '{}',
  add column if not exists points        integer not null default 0,
  add column if not exists streak_days   integer not null default 0,
  add column if not exists badges        text[] not null default '{}',
  add column if not exists state         text,
  add column if not exists city          text,
  add column if not exists avatar_url    text,
  add column if not exists bio           text;

-- ---------- MATERIALS ----------
alter table public.materials
  add column if not exists owner_id      uuid references public.profiles(id) on delete cascade,
  add column if not exists material_type text,
  add column if not exists storage_path  text,
  add column if not exists vestibular    text not null default 'Todos',
  add column if not exists faculdade     text not null default 'Medicina',
  add column if not exists year          integer not null default extract(year from now())::integer,
  add column if not exists subject        text,
  add column if not exists external_url  text,
  add column if not exists file_url      text,
  add column if not exists upload_kind   text not null default 'file',
  add column if not exists tags          text[] not null default '{}',
  add column if not exists status        text not null default 'pending',
  add column if not exists rating        numeric(3, 2) not null default 0,
  add column if not exists views_count   integer not null default 0;

-- Backfill owner_id a partir do legado author_id (se a coluna existir)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'materials' and column_name = 'author_id'
  ) then
    update public.materials set owner_id = author_id where owner_id is null;
  end if;
end;
$$;

-- material_type padrão para linhas legadas
update public.materials set material_type = 'Resumo' where material_type is null;
update public.materials set subject = coalesce(subject, 'Interdisciplinar') where subject is null;

-- ---------- POSTS ----------
alter table public.posts
  add column if not exists tags text[] not null default '{}',
  add column if not exists material_id uuid references public.materials(id) on delete set null;

-- ---------- LIKES (legado post_id/material_id -> polimórfico target_type/target_id) ----------
alter table public.likes
  add column if not exists target_type text,
  add column if not exists target_id   uuid;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='likes' and column_name='post_id') then
    update public.likes set target_type = 'post', target_id = post_id
    where target_id is null and post_id is not null;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='likes' and column_name='material_id') then
    update public.likes set target_type = 'material', target_id = material_id
    where target_id is null and material_id is not null;
  end if;
end;
$$;

-- ---------- SAVED_POSTS (não existe no banco antigo) ----------
create table if not exists public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.saved_posts enable row level security;
drop policy if exists saved_posts_select_own on public.saved_posts;
create policy saved_posts_select_own on public.saved_posts for select using (auth.uid() = user_id);
drop policy if exists saved_posts_insert_own on public.saved_posts;
create policy saved_posts_insert_own on public.saved_posts for insert with check (auth.uid() = user_id);
drop policy if exists saved_posts_delete_own on public.saved_posts;
create policy saved_posts_delete_own on public.saved_posts for delete using (auth.uid() = user_id);

-- ---------- Verificação ----------
select 'materials.owner_id'     as col, exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='owner_id')      as ok
union all select 'materials.material_type', exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='material_type')
union all select 'posts.tags',              exists(select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='tags')
union all select 'likes.target_id',         exists(select 1 from information_schema.columns where table_schema='public' and table_name='likes' and column_name='target_id')
union all select 'profiles.points',         exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='points')
union all select 'profiles.dream_faculty',  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='dream_faculty')
union all select 'saved_posts table',       exists(select 1 from information_schema.tables  where table_schema='public' and table_name='saved_posts');
