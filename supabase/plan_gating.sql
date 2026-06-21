-- =====================================================================
-- ACERTE — Gating por plano reforçado no banco (server-side real)
-- Rode no Supabase: SQL Editor. Idempotente.
-- Pré-requisitos: plans_fixed.sql (coluna plan/is_premium),
--                 simulado_timer.sql (start_simulado), schema (saved_materials).
--
-- Regras:
--   Free        -> 2 simulados por mês, até 20 favoritos.
--   Premium     -> simulados e favoritos ILIMITADOS, acervo completo.
--   Premium Med -> tudo do Premium.
--   Admin       -> acesso total (ignora limites).
-- =====================================================================

-- ---------------- Helper: usuário tem acesso premium? -------------
-- Admin OU plano premium/premium_med dentro da validade.
create or replace function public.plan_has_premium(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user
      and (
        p.role = 'admin'
        or (
          p.plan in ('premium', 'premium_med')
          and (p.premium_until is null or p.premium_until > now())
        )
      )
  );
$$;
grant execute on function public.plan_has_premium(uuid) to anon, authenticated;

-- ---------------- RPC start_simulado com limite mensal -------------
-- Mantém a lógica original (retomar tentativa em andamento) e adiciona o
-- bloqueio de 2 simulados/mês para quem NÃO tem premium.
create or replace function public.start_simulado(p_simulado_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_started timestamptz;
  v_dur integer;
  v_total integer;
  v_used integer;
begin
  if v_user is null then
    raise exception 'É preciso estar logado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.simulados where id = p_simulado_id and status = 'published') then
    raise exception 'Simulado indisponível.';
  end if;

  -- Retoma tentativa em andamento (impede reiniciar o tempo ao recarregar).
  -- Retomar NÃO consome cota.
  select id, started_at, duration_minutes, total_questions
    into v_id, v_started, v_dur, v_total
  from public.simulado_attempts
  where simulado_id = p_simulado_id and user_id = v_user and status = 'in_progress'
  order by started_at desc limit 1;

  if v_id is not null then
    return jsonb_build_object('attempt_id', v_id, 'started_at', v_started,
      'duration_minutes', v_dur, 'total_questions', v_total, 'resumed', true);
  end if;

  -- Limite mensal para Free (premium/admin ignoram).
  if not public.plan_has_premium(v_user) then
    select count(*) into v_used
    from public.simulado_attempts
    where user_id = v_user
      and started_at >= date_trunc('month', now());

    if v_used >= 2 then
      raise exception 'Limite de 2 simulados por mês atingido no plano Gratuito. Assine o Premium para simulados ilimitados.'
        using errcode = 'P0001';
    end if;
  end if;

  select duration_minutes into v_dur from public.simulados where id = p_simulado_id;
  select count(*) into v_total from public.simulado_questions where simulado_id = p_simulado_id;

  insert into public.simulado_attempts (simulado_id, user_id, total_questions, duration_minutes, status, started_at, score)
  values (p_simulado_id, v_user, v_total, coalesce(v_dur, 60), 'in_progress', now(), 0)
  returning id, started_at into v_id, v_started;

  return jsonb_build_object('attempt_id', v_id, 'started_at', v_started,
    'duration_minutes', coalesce(v_dur, 60), 'total_questions', v_total, 'resumed', false);
end;
$$;
grant execute on function public.start_simulado(uuid) to authenticated;

-- ---------------- Trigger: limite de favoritos (Free = 20) -------------
create or replace function public.enforce_favorites_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Premium/admin: sem limite.
  if public.plan_has_premium(new.user_id) then
    return new;
  end if;

  select count(*) into v_count
  from public.saved_materials
  where user_id = new.user_id;

  if v_count >= 20 then
    raise exception 'Limite de 20 favoritos atingido no plano Gratuito. Assine o Premium para favoritos ilimitados.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_favorites_limit_trg on public.saved_materials;
create trigger enforce_favorites_limit_trg
  before insert on public.saved_materials
  for each row execute function public.enforce_favorites_limit();

-- ---------------- Verificação -------------
select 'plan_has_premium' as item,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='plan_has_premium') as ok
union all
select 'enforce_favorites_limit',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='enforce_favorites_limit')
union all
select 'enforce_favorites_limit_trg',
  exists(select 1 from pg_trigger where tgname='enforce_favorites_limit_trg' and not tgisinternal);
