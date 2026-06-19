-- =====================================================================
-- ACERTE — Planos (monetização)
-- Coluna de plano no perfil + helper para gating de conteúdo premium.
-- Rode no Supabase: SQL Editor. Idempotente. (Pré-req: schema.sql)
-- =====================================================================

alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists premium_until timestamptz;

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'premium', 'premium_med')) not valid;

-- O usuário é premium se o plano não for free e a validade (se houver) está no futuro.
create or replace function public.is_premium(p_profile_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_profile_id
      and p.plan in ('premium', 'premium_med')
      and (p.premium_until is null or p.premium_until > now())
  );
$$;
grant execute on function public.is_premium(uuid) to anon, authenticated;

-- Verificação
select 'profiles.plan' as item,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='plan') as ok
union all
select 'is_premium',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_premium');
