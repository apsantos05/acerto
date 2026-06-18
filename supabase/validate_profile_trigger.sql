-- =====================================================================
-- ACERTE — Validação do trigger auth.users -> profiles
-- Rode no Supabase: SQL Editor (executa como postgres, enxerga auth.*).
-- Cada bloco imprime um resultado. Nada é alterado aqui.
-- =====================================================================

-- 1) A função handle_new_user() existe?
select
  'função handle_new_user' as item,
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) as existe;

-- 2) O trigger on_auth_user_created existe em auth.users e está habilitado?
--    tgenabled: 'O' = habilitado | 'D' = desabilitado
select
  t.tgname               as trigger,
  c.relname              as tabela,
  n.nspname              as schema,
  t.tgenabled            as estado,          -- 'O' = ON
  pg_get_triggerdef(t.oid) as definicao
from pg_trigger t
join pg_class c     on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where t.tgname = 'on_auth_user_created'
  and n.nspname = 'auth'
  and c.relname = 'users';
-- Se não retornar nenhuma linha => o trigger NÃO existe (causa do profiles vazio).

-- 3) Colunas reais da tabela profiles (para detectar divergência de schema)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 4) Quantos usuários existem em auth.users x quantos perfis em profiles?
select
  (select count(*) from auth.users)        as total_auth_users,
  (select count(*) from public.profiles)   as total_profiles;

-- 5) Usuários SEM perfil (os que precisam de backfill)
select u.id, u.email, u.created_at
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
order by u.created_at;
