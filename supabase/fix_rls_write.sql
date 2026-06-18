-- =====================================================================
-- ACERTE — Correção de RLS de ESCRITA (rode no SQL Editor do Supabase)
-- Idempotente. Recria as policies de escrita usando as colunas que o
-- código realmente envia:
--   posts.author_id, materials.owner_id, comments.author_id,
--   likes.user_id, saved_posts.user_id, saved_materials.user_id
-- e libera o bucket "materials" para o dono da pasta {user_id}/...
--
-- Causa do erro "new row violates row-level security policy":
-- a migração de colunas foi aplicada, mas as POLICIES continuaram as
-- antigas (apontando para author_id em materials). Como o código grava
-- owner_id (e não author_id), o "with check" antigo falhava.
-- =====================================================================

-- Legado: não deixar o author_id NOT NULL bloquear inserts que usam owner_id
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='materials'
      and column_name='author_id' and is_nullable='NO'
  ) then
    alter table public.materials alter column author_id drop not null;
  end if;
end;
$$;

-- ---------- POSTS ----------
alter table public.posts enable row level security;
drop policy if exists posts_select_all on public.posts;
create policy posts_select_all on public.posts for select using (true);
drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts for delete using (auth.uid() = author_id);

-- ---------- MATERIALS ----------
alter table public.materials enable row level security;
drop policy if exists materials_select_public on public.materials;
create policy materials_select_public on public.materials for select
  using (status = 'approved' or auth.uid() = owner_id);
drop policy if exists materials_insert_own on public.materials;
create policy materials_insert_own on public.materials for insert
  with check (auth.uid() = owner_id);
drop policy if exists materials_update_own on public.materials;
create policy materials_update_own on public.materials for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists materials_delete_own on public.materials;
create policy materials_delete_own on public.materials for delete
  using (auth.uid() = owner_id);

-- ---------- COMMENTS ----------
alter table public.comments enable row level security;
drop policy if exists comments_select_all on public.comments;
create policy comments_select_all on public.comments for select using (true);
drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments for delete using (auth.uid() = author_id);

-- ---------- LIKES (polimórfico; upsert precisa de insert + update) ----------
alter table public.likes enable row level security;
drop policy if exists likes_select_all on public.likes;
create policy likes_select_all on public.likes for select using (true);
drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists likes_update_own on public.likes;
create policy likes_update_own on public.likes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes for delete using (auth.uid() = user_id);

-- ---------- SAVED_POSTS (upsert) ----------
alter table public.saved_posts enable row level security;
drop policy if exists saved_posts_select_own on public.saved_posts;
create policy saved_posts_select_own on public.saved_posts for select using (auth.uid() = user_id);
drop policy if exists saved_posts_insert_own on public.saved_posts;
create policy saved_posts_insert_own on public.saved_posts for insert with check (auth.uid() = user_id);
drop policy if exists saved_posts_update_own on public.saved_posts;
create policy saved_posts_update_own on public.saved_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists saved_posts_delete_own on public.saved_posts;
create policy saved_posts_delete_own on public.saved_posts for delete using (auth.uid() = user_id);

-- ---------- SAVED_MATERIALS (upsert) ----------
alter table public.saved_materials enable row level security;
drop policy if exists saved_materials_select_own on public.saved_materials;
create policy saved_materials_select_own on public.saved_materials for select using (auth.uid() = user_id);
drop policy if exists saved_materials_insert_own on public.saved_materials;
create policy saved_materials_insert_own on public.saved_materials for insert with check (auth.uid() = user_id);
drop policy if exists saved_materials_update_own on public.saved_materials;
create policy saved_materials_update_own on public.saved_materials for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists saved_materials_delete_own on public.saved_materials;
create policy saved_materials_delete_own on public.saved_materials for delete using (auth.uid() = user_id);

-- ---------- STORAGE.OBJECTS (bucket "materials"; pasta = {user_id}/...) ----------
drop policy if exists materials_objects_select on storage.objects;
create policy materials_objects_select on storage.objects for select
  using (bucket_id = 'materials');
drop policy if exists materials_objects_insert on storage.objects;
create policy materials_objects_insert on storage.objects for insert
  with check (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists materials_objects_update on storage.objects;
create policy materials_objects_update on storage.objects for update
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists materials_objects_delete on storage.objects;
create policy materials_objects_delete on storage.objects for delete
  using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Verificação ----------
select tablename, cmd, qual is not null as has_using, with_check is not null as has_check, policyname
from pg_policies
where schemaname='public'
  and tablename in ('posts','materials','comments','likes','saved_posts','saved_materials')
order by tablename, cmd, policyname;
