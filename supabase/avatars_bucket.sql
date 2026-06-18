-- =====================================================================
-- ACERTE — Bucket de avatars + policies de Storage
-- Rode no Supabase: SQL Editor. Idempotente.
--
-- O upload de foto de perfil envia para o bucket "avatars" no caminho
-- {user_id}/avatar-<uuid>.<ext> e salva a URL pública em profiles.avatar_url.
-- =====================================================================

-- Cria/garante o bucket público "avatars"
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Leitura pública (avatares aparecem no perfil e na navbar)
drop policy if exists avatars_select_public on storage.objects;
create policy avatars_select_public on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload/atualização/remoção apenas na própria pasta {user_id}/...
drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Garante que o update de profiles (bio, dream_faculty, target_exams, avatar_url)
-- está liberado para o dono (idempotente)
alter table public.profiles enable row level security;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Verificação
select 'bucket avatars' as item, exists(select 1 from storage.buckets where id='avatars') as ok
union all
select 'avatars policies', (select count(*) >= 4 from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'avatars_%');
