-- =====================================================================
-- ACERTE — Reputação e ranking REAIS (sem dados mockados)
-- Rode no Supabase: SQL Editor. Idempotente.
--
-- Pontuação:
--   material aprovado .............. +20
--   post publicado ................. +5
--   comentário publicado ........... +3
--   curtida recebida em material ... +2
--   material salvo por outro ....... +5
--   avaliação recebida em material . +1
--
-- A reputação é calculada SEMPRE a partir dos dados reais (nada é
-- armazenado/mockado), então fica automaticamente atualizada.
-- =====================================================================

-- Garante a tabela de avaliações (caso material_ratings.sql não tenha rodado)
create table if not exists public.material_ratings (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, user_id)
);

-- Ranking de reputação, com filtros opcionais por matéria/vestibular.
-- Quando há filtro, considera apenas os pontos vindos de materiais daquela
-- categoria (posts/comentários não são categorizáveis).
create or replace function public.get_reputation_ranking(
  filter_subject text default null,
  filter_vestibular text default null,
  limit_count integer default 20
)
returns table (
  rank_position bigint,
  profile_id uuid,
  username text,
  full_name text,
  avatar_url text,
  city text,
  state text,
  dream_faculty text,
  total_points bigint,
  approved_materials bigint,
  material_likes_received bigint,
  material_saves_received bigint,
  comments_made bigint,
  posts_created bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with mats as (
    select m.id, m.owner_id
    from public.materials m
    where m.status = 'approved'
      and (filter_subject is null or m.subject = filter_subject)
      and (filter_vestibular is null or m.vestibular = filter_vestibular)
  ),
  mat_counts as (
    select owner_id, count(*)::bigint c from mats group by owner_id
  ),
  mat_likes as (
    select m.owner_id, count(*)::bigint c
    from public.likes l
    join mats m on l.target_type = 'material' and l.target_id = m.id
    group by m.owner_id
  ),
  mat_saves as (
    select m.owner_id, count(*)::bigint c
    from public.saved_materials s
    join mats m on s.material_id = m.id
    group by m.owner_id
  ),
  mat_ratings as (
    select m.owner_id, count(*)::bigint c
    from public.material_ratings r
    join mats m on r.material_id = m.id
    group by m.owner_id
  ),
  post_counts as (
    select author_id, count(*)::bigint c from public.posts group by author_id
  ),
  comment_counts as (
    select author_id, count(*)::bigint c from public.comments group by author_id
  ),
  agg as (
    select
      p.id as profile_id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.city,
      p.state,
      p.dream_faculty,
      coalesce(mc.c, 0) as approved_materials,
      coalesce(ml.c, 0) as material_likes_received,
      coalesce(ms.c, 0) as material_saves_received,
      coalesce(cc.c, 0) as comments_made,
      coalesce(pc.c, 0) as posts_created,
      (
        coalesce(mc.c, 0) * 20
        + coalesce(ml.c, 0) * 2
        + coalesce(ms.c, 0) * 5
        + coalesce(mr.c, 0) * 1
        + case
            when filter_subject is null and filter_vestibular is null
            then coalesce(pc.c, 0) * 5 + coalesce(cc.c, 0) * 3
            else 0
          end
      )::bigint as total_points
    from public.profiles p
    left join mat_counts mc on mc.owner_id = p.id
    left join mat_likes ml on ml.owner_id = p.id
    left join mat_saves ms on ms.owner_id = p.id
    left join mat_ratings mr on mr.owner_id = p.id
    left join post_counts pc on pc.author_id = p.id
    left join comment_counts cc on cc.author_id = p.id
  )
  select
    row_number() over (order by total_points desc, full_name asc) as rank_position,
    profile_id, username, full_name, avatar_url, city, state, dream_faculty,
    total_points, approved_materials, material_likes_received,
    material_saves_received, comments_made, posts_created
  from agg
  where total_points > 0
  order by total_points desc, full_name asc
  limit limit_count;
$$;

-- Reputação + posição de um perfil específico (reaproveita o ranking geral)
create or replace function public.get_profile_reputation(p_profile_id uuid)
returns table (total_points bigint, rank_position bigint)
language sql
stable
security definer
set search_path = public
as $$
  select r.total_points, r.rank_position
  from public.get_reputation_ranking(null, null, 1000000) r
  where r.profile_id = p_profile_id;
$$;

grant execute on function public.get_reputation_ranking(text, text, integer) to anon, authenticated;
grant execute on function public.get_profile_reputation(uuid) to anon, authenticated;

-- Verificação
select 'get_reputation_ranking' as item,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_reputation_ranking') as ok
union all
select 'get_profile_reputation',
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='get_profile_reputation');
