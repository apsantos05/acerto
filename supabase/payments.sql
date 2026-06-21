-- =====================================================================
-- ACERTE — Pagamentos / Assinaturas (Mercado Pago)
-- Rode no Supabase: SQL Editor. Idempotente.
-- Pré-requisitos: plans_fixed.sql (profiles.plan/premium_until),
--                 admin_role.sql (is_admin()).
--
-- Tabelas:
--   subscriptions   -> assinatura do usuário (1 ativa por vez, idealmente)
--   payment_events  -> log bruto de TODOS os webhooks recebidos (auditoria)
-- Segurança:
--   - escrita só via service_role (webhook); cliente nunca grava.
--   - trigger protege profiles.plan / premium_until contra alteração manual.
-- =====================================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  provider text not null default 'mercado_pago',
  provider_subscription_id text,
  status text not null default 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'premium', 'premium_med')) not valid;

alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending', 'active', 'cancelled', 'paused', 'past_due')) not valid;

-- Uma linha por assinatura do provedor (idempotência do webhook via upsert).
create unique index if not exists subscriptions_provider_sub_idx
  on public.subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercado_pago',
  event_type text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payment_events_created_idx on public.payment_events(created_at desc);

-- updated_at automático (reusa touch_updated_at se existir)
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
             where n.nspname='public' and p.proname='touch_updated_at') then
    drop trigger if exists subscriptions_touch on public.subscriptions;
    create trigger subscriptions_touch before update on public.subscriptions
      for each row execute function public.touch_updated_at();
  end if;
end $$;

-- ---------------- RLS ----------------
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

-- Usuário lê a própria assinatura; admin lê todas. Ninguém grava pelo cliente
-- (sem policies de insert/update/delete -> só service_role grava).
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

-- payment_events: somente admin lê (auditoria). service_role ignora RLS.
drop policy if exists payment_events_select_admin on public.payment_events;
create policy payment_events_select_admin on public.payment_events for select
  using (public.is_admin());

grant select on public.subscriptions to authenticated;
grant select on public.payment_events to authenticated;
grant all on public.subscriptions to service_role;
grant all on public.payment_events to service_role;

-- ---------------- Proteção: plano não muda pelo cliente ----------------
-- Reverte silenciosamente qualquer alteração de plan/premium_until feita por
-- quem não é service_role nem admin. Assim o edit-profile-form (que altera
-- bio/avatar) continua funcionando, mas o plano só muda via webhook/admin.
create or replace function public.protect_plan_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.plan is distinct from old.plan
      or new.premium_until is distinct from old.premium_until) then
    if current_user <> 'service_role' and not public.is_admin() then
      new.plan := old.plan;
      new.premium_until := old.premium_until;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_plan_columns_trg on public.profiles;
create trigger protect_plan_columns_trg
  before update on public.profiles
  for each row execute function public.protect_plan_columns();

-- ---------------- Verificação ----------------
select 'subscriptions' as item, (to_regclass('public.subscriptions') is not null)::text as ok
union all
select 'payment_events', (to_regclass('public.payment_events') is not null)::text
union all
select 'protect_plan_columns_trg',
  (exists(select 1 from pg_trigger where tgname='protect_plan_columns_trg' and not tgisinternal))::text;
