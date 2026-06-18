-- =====================================================================
-- ACERTE — Reformulação do Perfil
-- Capa, sequência de estudos (study_streak/last_activity_at),
-- badges persistidos (user_badges) e concessão automática.
-- Rode no Supabase: SQL Editor. Idempotente.
-- Pré-requisitos: schema.sql, reputation_ranking.sql, simulado_timer.sql,
--                 study_planner.sql, study_history.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Colunas novas em profiles
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists cover_url text,
  add column if not exists study_streak integer not null default 0,
  add column if not exists last_activity_at timestamptz;

-- Mantém study_streak alinhado ao streak_days legado, se houver dados antigos
update public.profiles
  set study_streak = streak_days
  where study_streak = 0 and coalesce(streak_days, 0) > 0;

-- ---------------------------------------------------------------------
-- 2) Sequência de estudos
--    Registra atividade e recalcula a sequência diária (fuso de SP).
--    +1 se a última atividade foi ontem, mantém se foi hoje, reinicia
--    em 1 caso contrário.
-- ---------------------------------------------------------------------
create or replace function public.register_study_activity(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
  v_streak integer;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_last_day date;
  v_new_streak integer;
begin
  if p_user_id is null then
    return;
  end if;

  select last_activity_at, study_streak
    into v_last, v_streak
  from public.profiles
  where id = p_user_id;

  if not found then
    return;
  end if;

  if v_last is null then
    v_new_streak := 1;
  else
    v_last_day := (v_last at time zone 'America/Sao_Paulo')::date;
    if v_last_day = v_today then
      v_new_streak := greatest(coalesce(v_streak, 0), 1);
    elsif v_last_day = v_today - 1 then
      v_new_streak := coalesce(v_streak, 0) + 1;
    else
      v_new_streak := 1;
    end if;
  end if;

  update public.profiles
    set last_activity_at = now(),
        study_streak = v_new_streak,
        streak_days = v_new_streak
  where id = p_user_id;
end;
$$;
grant execute on function public.register_study_activity(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Gatilhos: cada ação relevante conta como atividade do dia
--    post · comentário · material · simulado finalizado · tarefa concluída
-- ---------------------------------------------------------------------
create or replace function public.trg_activity_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.register_study_activity(new.author_id); return new; end;
$$;

create or replace function public.trg_activity_comment()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.register_study_activity(new.author_id); return new; end;
$$;

create or replace function public.trg_activity_material()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.register_study_activity(new.owner_id); return new; end;
$$;

create or replace function public.trg_activity_simulado()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.register_study_activity(new.user_id); return new; end;
$$;

create or replace function public.trg_activity_task()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.register_study_activity(new.user_id); return new; end;
$$;

drop trigger if exists trg_activity_post on public.posts;
create trigger trg_activity_post
  after insert on public.posts
  for each row execute function public.trg_activity_post();

drop trigger if exists trg_activity_comment on public.comments;
create trigger trg_activity_comment
  after insert on public.comments
  for each row execute function public.trg_activity_comment();

drop trigger if exists trg_activity_material on public.materials;
create trigger trg_activity_material
  after insert on public.materials
  for each row execute function public.trg_activity_material();

drop trigger if exists trg_activity_simulado on public.simulado_attempts;
create trigger trg_activity_simulado
  after update on public.simulado_attempts
  for each row
  when (new.status in ('completed', 'expired') and old.status is distinct from new.status)
  execute function public.trg_activity_simulado();

drop trigger if exists trg_activity_task on public.study_tasks;
create trigger trg_activity_task
  after update on public.study_tasks
  for each row
  when (new.status = 'completed' and old.status is distinct from new.status)
  execute function public.trg_activity_task();

-- ---------------------------------------------------------------------
-- 4) Badges persistidos
-- ---------------------------------------------------------------------
create table if not exists public.user_badges (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_code text not null,
  earned_at timestamptz not null default now(),
  primary key (profile_id, badge_code)
);
create index if not exists user_badges_profile_idx on public.user_badges (profile_id);

alter table public.user_badges enable row level security;

-- Leitura pública (badges aparecem em qualquer perfil)
drop policy if exists user_badges_select_public on public.user_badges;
create policy user_badges_select_public
  on public.user_badges for select
  using (true);

-- Escrita SOMENTE via sync_user_badges() (security definer). Sem policy de
-- insert/update/delete: nenhum cliente consegue forjar badges.

-- ---------------------------------------------------------------------
-- 5) Concessão automática de badges a partir de dados 100% reais.
--    Os códigos e limites espelham src/lib/achievements.ts.
-- ---------------------------------------------------------------------
create or replace function public.sync_user_badges(p_profile_id uuid)
returns table (badge_code text, earned_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_materials bigint;
  v_posts bigint;
  v_comments bigint;
  v_likes bigint;
  v_simulados bigint;
  v_points bigint;
  v_rank bigint;
  v_streak integer;
  v_codes text[] := '{}';
begin
  if p_profile_id is null then
    return;
  end if;

  select count(*) into v_materials
    from public.materials where owner_id = p_profile_id and status = 'approved';
  select count(*) into v_posts
    from public.posts where author_id = p_profile_id;
  select count(*) into v_comments
    from public.comments where author_id = p_profile_id;
  select count(*) into v_simulados
    from public.simulado_attempts where user_id = p_profile_id and status = 'completed';

  select coalesce(sum(c), 0) into v_likes from (
    select count(*) c
      from public.likes l
      join public.posts p on l.target_type = 'post' and l.target_id = p.id
      where p.author_id = p_profile_id
    union all
    select count(*) c
      from public.likes l
      join public.materials m on l.target_type = 'material' and l.target_id = m.id
      where m.owner_id = p_profile_id
  ) s;

  select total_points, rank_position into v_points, v_rank
    from public.get_profile_reputation(p_profile_id);
  v_points := coalesce(v_points, 0);

  select study_streak into v_streak from public.profiles where id = p_profile_id;
  v_streak := coalesce(v_streak, 0);

  -- Materiais
  if v_materials >= 1  then v_codes := array_append(v_codes, 'material_1');  end if;
  if v_materials >= 5  then v_codes := array_append(v_codes, 'material_5');  end if;
  if v_materials >= 20 then v_codes := array_append(v_codes, 'material_20'); end if;
  -- Comunidade
  if v_posts >= 1     then v_codes := array_append(v_codes, 'post_1');    end if;
  if v_posts >= 10    then v_codes := array_append(v_codes, 'post_10');   end if;
  if v_comments >= 10 then v_codes := array_append(v_codes, 'comment_10'); end if;
  if v_likes >= 50    then v_codes := array_append(v_codes, 'likes_50');  end if;
  -- Simulados
  if v_simulados >= 1  then v_codes := array_append(v_codes, 'simulado_1');  end if;
  if v_simulados >= 10 then v_codes := array_append(v_codes, 'simulado_10'); end if;
  -- Reputação
  if v_points >= 100 then v_codes := array_append(v_codes, 'rep_100'); end if;
  if v_points >= 500 then v_codes := array_append(v_codes, 'rep_500'); end if;
  if v_rank is not null and v_rank <= 10 then v_codes := array_append(v_codes, 'top_10'); end if;
  if v_rank is not null and v_rank <= 3  then v_codes := array_append(v_codes, 'top_3');  end if;
  -- Consistência
  if v_streak >= 7  then v_codes := array_append(v_codes, 'streak_7');  end if;
  if v_streak >= 30 then v_codes := array_append(v_codes, 'streak_30'); end if;

  if array_length(v_codes, 1) is not null then
    insert into public.user_badges (profile_id, badge_code)
    select p_profile_id, code from unnest(v_codes) as code
    on conflict (profile_id, badge_code) do nothing;
  end if;

  return query
    select ub.badge_code, ub.earned_at
    from public.user_badges ub
    where ub.profile_id = p_profile_id;
end;
$$;
grant execute on function public.sync_user_badges(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 6) Verificação
-- ---------------------------------------------------------------------
select 'profiles.cover_url' as item,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='cover_url') as ok
union all
select 'profiles.study_streak',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='study_streak')
union all
select 'profiles.last_activity_at',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='last_activity_at')
union all
select 'register_study_activity',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='register_study_activity')
union all
select 'user_badges',
  exists(select 1 from information_schema.tables where table_schema='public' and table_name='user_badges')
union all
select 'sync_user_badges',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='sync_user_badges')
union all
select 'trg_activity_post',
  exists(select 1 from pg_trigger where tgname='trg_activity_post')
union all
select 'trg_activity_simulado',
  exists(select 1 from pg_trigger where tgname='trg_activity_simulado')
union all
select 'trg_activity_task',
  exists(select 1 from pg_trigger where tgname='trg_activity_task');
