-- =====================================================================
-- ACERTE — Papel de admin + moderação de materiais
-- Rode no Supabase: SQL Editor. Idempotente.
-- =====================================================================

-- Campo de papel no perfil
alter table public.profiles add column if not exists role text not null default 'user';

-- Helper: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- MATERIALS: admin pode ver materiais pendentes (além do dono) ...
drop policy if exists materials_select_public on public.materials;
create policy materials_select_public on public.materials for select
  using (status = 'approved' or auth.uid() = owner_id or public.is_admin());

-- ... e pode atualizar o status (aprovar/rejeitar) de qualquer material.
-- (Convive com materials_update_own; políticas permissivas são OR.)
drop policy if exists materials_admin_update on public.materials;
create policy materials_admin_update on public.materials for update
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- DEFINA SEU USUÁRIO COMO ADMIN  (troque o e-mail abaixo e rode):
-- =====================================================================
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'SEU_EMAIL_AQUI');

-- Verificação
select 'profiles.role' as item,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role') as ok
union all
select 'is_admin() existe',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_admin')
union all
select 'admins cadastrados',
  (select count(*) > 0 from public.profiles where role='admin');
