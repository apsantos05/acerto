-- =====================================================================
-- ACERTE — Correção COMPLETA: auth.users -> public.profiles
-- Rode no Supabase: SQL Editor (executa como postgres). Idempotente.
--
-- Passos:
--   A) Colunas usadas pela função (à prova de schema desatualizado)
--   B) RLS + policies da profiles (select público, insert/update do dono)
--   C) Grants necessários (papéis anon / authenticated / service_role)
--   D) Função handle_new_user() (SECURITY DEFINER -> ignora RLS)
--   E) Trigger on_auth_user_created em auth.users
--   F) Backfill dos usuários já existentes
--   G) Verificação automática (função, trigger, policies, contagens)
-- =====================================================================

-- A) Colunas mínimas -----------------------------------------------------
alter table public.profiles add column if not exists username  text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email     text;

-- B) RLS + policies ------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id);

-- C) Grants (padrão Supabase; a função roda como owner, mas estes grants
--    garantem que o app (anon/authenticated) consiga ler/gravar o próprio perfil)
grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- D) Função --------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, email)
  values (
    new.id,
    lower(
      regexp_replace(
        coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
        '[^a-zA-Z0-9_]+', '-', 'g'
      )
    ) || '-' || left(new.id::text, 8),
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (id) do update
    set username  = coalesce(public.profiles.username, excluded.username),
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email     = excluded.email;

  return new;
end;
$$;

-- Garante que a função pertence a um papel com direito de inserir em profiles
alter function public.handle_new_user() owner to postgres;

-- E) Trigger -------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- F) Backfill ------------------------------------------------------------
insert into public.profiles (id, username, full_name, email)
select
  u.id,
  lower(
    regexp_replace(
      coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1)),
      '[^a-zA-Z0-9_]+', '-', 'g'
    )
  ) || '-' || left(u.id::text, 8),
  u.raw_user_meta_data ->> 'full_name',
  u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- G) Verificação ---------------------------------------------------------
select 'funcao handle_new_user existe' as check,
  exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
          where n.nspname='public' and p.proname='handle_new_user') as ok;

select 'trigger on_auth_user_created ativo' as check,
  exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid
          join pg_namespace n on n.oid=c.relnamespace
          where t.tgname='on_auth_user_created' and n.nspname='auth'
            and c.relname='users' and t.tgenabled='O') as ok;

select 'policies da profiles' as check, count(*) as total
  from pg_policies where schemaname='public' and tablename='profiles';

select
  (select count(*) from auth.users)      as total_auth_users,
  (select count(*) from public.profiles) as total_profiles;
