-- =====================================================================
-- ACERTE — Verificação pós-migração (rode no SQL Editor do Supabase)
-- Apenas leitura. Confirma colunas, tabelas, RLS, policies e trigger.
-- Cada linha traz ok=true quando está correto.
-- =====================================================================

-- 1) COLUNAS esperadas pelo código
with esperado(tabela, coluna) as (
  values
    ('profiles','username'),('profiles','full_name'),('profiles','email'),
    ('profiles','avatar_url'),('profiles','bio'),('profiles','objective'),
    ('profiles','dream_faculty'),('profiles','target_exams'),('profiles','points'),
    ('profiles','streak_days'),('profiles','badges'),('profiles','city'),('profiles','state'),
    ('materials','owner_id'),('materials','material_type'),('materials','storage_path'),
    ('materials','vestibular'),('materials','faculdade'),('materials','year'),
    ('materials','subject'),('materials','file_url'),('materials','external_url'),
    ('materials','upload_kind'),('materials','tags'),('materials','status'),
    ('materials','rating'),('materials','views_count'),
    ('materials','vestibular_id'),('materials','faculty_id'),
    ('posts','author_id'),('posts','material_id'),('posts','content'),('posts','tags'),
    ('comments','post_id'),('comments','author_id'),('comments','content'),
    ('likes','target_type'),('likes','target_id'),('likes','user_id'),
    ('saved_posts','post_id'),('saved_posts','user_id'),
    ('saved_materials','user_id'),('saved_materials','material_id'),
    ('vestibulares','name'),('faculties','name')
)
select e.tabela, e.coluna,
  exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = e.tabela and c.column_name = e.coluna
  ) as ok
from esperado e
order by ok asc, e.tabela, e.coluna;  -- faltantes (false) aparecem primeiro

-- 2) TABELAS existem
select t.tabela,
  exists (select 1 from information_schema.tables it
          where it.table_schema='public' and it.table_name=t.tabela) as existe
from (values ('profiles'),('materials'),('posts'),('comments'),('likes'),
             ('saved_posts'),('saved_materials'),('vestibulares'),('faculties')) t(tabela)
order by existe asc, t.tabela;

-- 3) RLS habilitado por tabela
select c.relname as tabela, c.relrowsecurity as rls_on
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('profiles','materials','posts','comments','likes',
                    'saved_posts','saved_materials','vestibulares','faculties')
order by rls_on asc, c.relname;

-- 4) POLICIES por tabela (espera-se >= 1 em cada tabela com escrita)
select tablename, count(*) as policies
from pg_policies
where schemaname='public'
group by tablename
order by tablename;

-- 5) TRIGGER de criação de perfil
select 'trigger on_auth_user_created' as item,
  exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where t.tgname='on_auth_user_created' and n.nspname='auth'
      and c.relname='users' and t.tgenabled='O'
  ) as ok;

-- 6) Contagens rápidas
select
  (select count(*) from public.profiles)   as profiles,
  (select count(*) from public.materials)  as materials,
  (select count(*) from public.posts)      as posts,
  (select count(*) from public.likes)      as likes;
