-- =====================================================================
-- ACERTE — Avaliação de materiais (1 a 5 estrelas)
-- Rode no Supabase: SQL Editor. Idempotente.
-- =====================================================================

-- Coluna de contagem de avaliações na materials (a média já existe: rating)
alter table public.materials add column if not exists ratings_count integer not null default 0;

-- Tabela de avaliações (uma por usuário por material)
create table if not exists public.material_ratings (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, user_id)
);
create index if not exists material_ratings_material_idx on public.material_ratings (material_id);

-- RLS
alter table public.material_ratings enable row level security;

drop policy if exists material_ratings_select_all on public.material_ratings;
create policy material_ratings_select_all on public.material_ratings
  for select using (true);

drop policy if exists material_ratings_insert_own on public.material_ratings;
create policy material_ratings_insert_own on public.material_ratings
  for insert with check (auth.uid() = user_id);

drop policy if exists material_ratings_update_own on public.material_ratings;
create policy material_ratings_update_own on public.material_ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists material_ratings_delete_own on public.material_ratings;
create policy material_ratings_delete_own on public.material_ratings
  for delete using (auth.uid() = user_id);

-- updated_at automático
create or replace function public.touch_material_rating()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_material_rating_touch on public.material_ratings;
create trigger trg_material_rating_touch
  before update on public.material_ratings
  for each row execute function public.touch_material_rating();

-- Recalcula media (materials.rating) e contagem (materials.ratings_count)
create or replace function public.recompute_material_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  mid uuid := coalesce(new.material_id, old.material_id);
begin
  update public.materials m
  set rating = coalesce(
        (select round(avg(rating)::numeric, 2) from public.material_ratings where material_id = mid),
        0
      ),
      ratings_count = (select count(*) from public.material_ratings where material_id = mid)
  where m.id = mid;
  return null;
end;
$$;

drop trigger if exists trg_material_rating_recompute on public.material_ratings;
create trigger trg_material_rating_recompute
  after insert or update or delete on public.material_ratings
  for each row execute function public.recompute_material_rating();

-- Verificação
select 'material_ratings' as item,
  exists(select 1 from information_schema.tables where table_schema='public' and table_name='material_ratings') as ok
union all
select 'materials.ratings_count',
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='materials' and column_name='ratings_count')
union all
select 'policies material_ratings',
  (select count(*) >= 4 from pg_policies where schemaname='public' and tablename='material_ratings');
