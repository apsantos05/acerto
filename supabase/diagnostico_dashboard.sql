-- =====================================================================
-- ACERTAVEST — Dashboard de Conversão dos Diagnósticos
-- Rode no Supabase: SQL Editor. Idempotente.
-- Pré-requisitos: diagnostico_aprovacao.sql, plans_fixed.sql, admin_role.sql.
--
-- RPC única que devolve TODAS as métricas agregadas em um jsonb (1 round-trip,
-- sem N+1, sem trazer linhas para a aplicação). Guardada por is_admin().
-- Conversão é medida pelo PLANO ATUAL do usuário (profiles.plan), juntando
-- approval_diagnostics.user_id -> profiles.id.
-- =====================================================================

create or replace function public.get_diagnostics_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  with d as (
    select ad.id, ad.user_id, ad.target_university, ad.target_vestibular,
           ad.main_difficulty, ad.recommended_plan, ad.preparation_score, ad.created_at,
           p.plan as user_plan
    from public.approval_diagnostics ad
    left join public.profiles p on p.id = ad.user_id
  )
  select jsonb_build_object(
    'total', (select count(*) from d),
    'last7', (select count(*) from d where created_at >= now() - interval '7 days'),
    'last30', (select count(*) from d where created_at >= now() - interval '30 days'),
    'avg_score', (select coalesce(round(avg(preparation_score)), 0) from d),
    'registered', (select count(*) from d where user_id is not null),
    'premium', (select count(*) from d where user_plan in ('premium', 'premium_med')),
    'premium_med', (select count(*) from d where user_plan = 'premium_med'),

    'score_dist', (
      select coalesce(jsonb_agg(jsonb_build_object('bucket', b.label, 'count', coalesce(c.cnt, 0)) order by b.ord), '[]'::jsonb)
      from (values ('0-20',1,0,20),('21-40',2,21,40),('41-60',3,41,60),('61-80',4,61,80),('81-100',5,81,100))
             as b(label, ord, lo, hi)
      left join lateral (
        select count(*) as cnt from d where preparation_score between b.lo and b.hi
      ) c on true
    ),

    'by_recommended', jsonb_build_object(
      'free', (select count(*) from d where recommended_plan = 'free'),
      'premium', (select count(*) from d where recommended_plan = 'premium'),
      'premium_med', (select count(*) from d where recommended_plan = 'premium_med')
    ),

    'conversion_real', jsonb_build_object(
      'rec_premium_total', (select count(*) from d where recommended_plan = 'premium'),
      'rec_premium_converted', (select count(*) from d where recommended_plan = 'premium' and user_plan in ('premium','premium_med')),
      'rec_premium_med_total', (select count(*) from d where recommended_plan = 'premium_med'),
      'rec_premium_med_converted', (select count(*) from d where recommended_plan = 'premium_med' and user_plan = 'premium_med')
    ),

    'evolution', (
      select coalesce(jsonb_agg(jsonb_build_object('day', to_char(g.day, 'YYYY-MM-DD'), 'count', coalesce(c.cnt, 0)) order by g.day), '[]'::jsonb)
      from generate_series((current_date - interval '29 days')::date, current_date, interval '1 day') as g(day)
      left join lateral (
        select count(*) as cnt from d where d.created_at::date = g.day::date
      ) c on true
    ),

    'top_universities', (
      select coalesce(jsonb_agg(t order by t.count desc), '[]'::jsonb)
      from (
        select target_university as name, count(*) as count
        from d where target_university is not null and target_university <> ''
        group by target_university order by count(*) desc limit 10
      ) t
    ),
    'top_vestibulares', (
      select coalesce(jsonb_agg(t order by t.count desc), '[]'::jsonb)
      from (
        select target_vestibular as name, count(*) as count
        from d where target_vestibular is not null and target_vestibular <> ''
        group by target_vestibular order by count(*) desc limit 10
      ) t
    ),
    'top_difficulties', (
      select coalesce(jsonb_agg(t order by t.count desc), '[]'::jsonb)
      from (
        select main_difficulty as name, count(*) as count
        from d where main_difficulty is not null and main_difficulty <> ''
        group by main_difficulty order by count(*) desc limit 10
      ) t
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.get_diagnostics_dashboard() to authenticated;

-- ---------------- Verificação ----------------
select 'get_diagnostics_dashboard' as item,
  (exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname='get_diagnostics_dashboard'))::text as ok;
