-- =====================================================================
-- ACERTE — Exclusão de materiais e posts pelo admin (cascade seguro)
-- Rode no Supabase: SQL Editor. Idempotente.
-- Requer: supabase/admin_role.sql (função is_admin()) já aplicado.
-- =====================================================================

-- Exclui um material e tudo relacionado (likes polimórficos, salvos,
-- avaliações e o registro de storage). Só admin pode executar.
create or replace function public.admin_delete_material(p_material_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem excluir materiais.'
      using errcode = '42501';
  end if;

  select storage_path into v_path from public.materials where id = p_material_id;

  -- Curtidas são polimórficas (sem FK) -> remover manualmente
  delete from public.likes where target_type = 'material' and target_id = p_material_id;
  delete from public.saved_materials where material_id = p_material_id;

  if to_regclass('public.material_ratings') is not null then
    execute 'delete from public.material_ratings where material_id = $1' using p_material_id;
  end if;

  -- Remove o registro do arquivo no Storage (o arquivo físico é removido
  -- pelo cliente via storage.remove; isto limpa metadados remanescentes)
  if v_path is not null then
    delete from storage.objects where bucket_id = 'materials' and name = v_path;
  end if;

  -- Posts que referenciam o material ficam com material_id nulo (FK set null)
  delete from public.materials where id = p_material_id;
end;
$$;

-- Exclui um post e tudo relacionado (comentários, salvos, curtidas).
create or replace function public.admin_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem excluir posts.'
      using errcode = '42501';
  end if;

  delete from public.likes where target_type = 'post' and target_id = p_post_id;
  delete from public.comments where post_id = p_post_id;
  delete from public.saved_posts where post_id = p_post_id;
  delete from public.posts where id = p_post_id;
end;
$$;

grant execute on function public.admin_delete_material(uuid) to authenticated;
grant execute on function public.admin_delete_post(uuid) to authenticated;

-- Admin pode remover arquivos de qualquer pasta no bucket "materials"
drop policy if exists materials_objects_admin_delete on storage.objects;
create policy materials_objects_admin_delete on storage.objects for delete
  using (bucket_id = 'materials' and public.is_admin());

-- Verificação
select 'admin_delete_material' as item,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='admin_delete_material') as ok
union all
select 'admin_delete_post',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='admin_delete_post');
