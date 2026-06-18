create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  objective text not null default 'Medicina',
  dream_faculty text,
  target_exams text[] not null default '{}',
  city text,
  state text,
  target_exam text,
  points integer not null default 0,
  streak_days integer not null default 0,
  badges text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text,
  add column if not exists email text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists objective text not null default 'Medicina',
  add column if not exists dream_faculty text,
  add column if not exists target_exams text[] not null default '{}',
  add column if not exists state text,
  add column if not exists streak_days integer not null default 0,
  add column if not exists badges text[] not null default '{}';

create unique index if not exists profiles_username_key
  on public.profiles (username)
  where username is not null;

update public.profiles
set username =
  lower(
    regexp_replace(
      coalesce(split_part(email, '@', 1), 'estudante'),
      '[^a-zA-Z0-9_]+',
      '-',
      'g'
    )
  ) || '-' || left(id::text, 8)
where username is null;

create table if not exists public.vestibulares (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text generated always as (
    lower(regexp_replace(name, '[^a-zA-Z0-9_]+', '-', 'g'))
  ) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text generated always as (
    lower(regexp_replace(name, '[^a-zA-Z0-9_]+', '-', 'g'))
  ) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  vestibular_id uuid references public.vestibulares(id) on delete set null,
  faculty_id uuid references public.faculties(id) on delete set null,
  title text not null,
  description text,
  vestibular text not null default 'Todos',
  faculdade text not null default 'Medicina',
  year integer not null default extract(year from now())::integer,
  subject text not null,
  material_type text not null,
  file_url text,
  external_url text,
  storage_path text,
  upload_kind text not null default 'file',
  tags text[] not null default '{}',
  status text not null default 'pending',
  rating numeric(3, 2) not null default 0,
  views_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.materials
  add column if not exists vestibular_id uuid references public.vestibulares(id) on delete set null,
  add column if not exists faculty_id uuid references public.faculties(id) on delete set null,
  add column if not exists vestibular text not null default 'Todos',
  add column if not exists faculdade text not null default 'Medicina',
  add column if not exists year integer not null default extract(year from now())::integer,
  add column if not exists external_url text,
  add column if not exists storage_path text,
  add column if not exists upload_kind text not null default 'file',
  add column if not exists tags text[] not null default '{}',
  add column if not exists status text not null default 'pending',
  add column if not exists views_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'materials_material_type_check'
  ) then
    alter table public.materials
      add constraint materials_material_type_check
      check (
        material_type in (
          'Prova',
          'Gabarito',
          'Simulado',
          'Resumo',
          'Lista de exercicios',
          'Lista de exercícios',
          'Mapa mental'
        )
      ) not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'materials_status_check'
  ) then
    alter table public.materials
      add constraint materials_status_check
      check (status in ('pending', 'approved', 'rejected')) not valid;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'materials_upload_kind_check'
  ) then
    alter table public.materials
      add constraint materials_upload_kind_check
      check (upload_kind in ('file', 'link')) not valid;
  end if;
end;
$$;

create table if not exists public.saved_materials (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid references public.materials(id) on delete set null,
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  target_type text not null,
  target_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (target_type, target_id, user_id),
  constraint likes_target_type_check check (target_type in ('post', 'material'))
);

create table if not exists public.saved_posts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_posts'::regclass
      and conname = 'saved_posts_post_id_fkey'
  ) then
    alter table public.saved_posts
      drop constraint saved_posts_post_id_fkey;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_posts'::regclass
      and conname = 'saved_posts_post_id_posts_fkey'
  ) then
    alter table public.saved_posts
      add constraint saved_posts_post_id_posts_fkey
      foreign key (post_id)
      references public.posts(id)
      on delete cascade
      not valid;
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.feed_posts') is not null then
    insert into public.posts (id, author_id, material_id, content, tags, created_at)
    select id, author_id, material_id, content, coalesce(tags, '{}'), created_at
    from public.feed_posts
    on conflict (id) do nothing;
  end if;

  if to_regclass('public.post_comments') is not null then
    insert into public.comments (id, post_id, author_id, content, created_at)
    select id, post_id, author_id, content, created_at
    from public.post_comments
    on conflict (id) do nothing;
  end if;

  if to_regclass('public.post_likes') is not null then
    insert into public.likes (target_type, target_id, user_id, created_at)
    select 'post', post_id, user_id, created_at
    from public.post_likes
    on conflict (target_type, target_id, user_id) do nothing;
  end if;

  if to_regclass('public.material_likes') is not null then
    insert into public.likes (target_type, target_id, user_id, created_at)
    select 'material', material_id, user_id, created_at
    from public.material_likes
    on conflict (target_type, target_id, user_id) do nothing;
  end if;
end;
$$;

insert into public.vestibulares (name)
select distinct vestibular
from public.materials
where vestibular is not null and trim(vestibular) <> ''
on conflict (name) do nothing;

insert into public.faculties (name)
select distinct faculdade
from public.materials
where faculdade is not null and trim(faculdade) <> ''
on conflict (name) do nothing;

update public.materials m
set vestibular_id = v.id
from public.vestibulares v
where m.vestibular_id is null and v.name = m.vestibular;

update public.materials m
set faculty_id = f.id
from public.faculties f
where m.faculty_id is null and f.name = m.faculdade;

alter table public.profiles enable row level security;
alter table public.vestibulares enable row level security;
alter table public.faculties enable row level security;
alter table public.materials enable row level security;
alter table public.saved_materials enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saved_posts enable row level security;

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

drop policy if exists vestibulares_select_public on public.vestibulares;
create policy vestibulares_select_public
  on public.vestibulares for select
  using (true);

drop policy if exists vestibulares_insert_auth on public.vestibulares;
create policy vestibulares_insert_auth
  on public.vestibulares for insert
  to authenticated
  with check (true);

drop policy if exists faculties_select_public on public.faculties;
create policy faculties_select_public
  on public.faculties for select
  using (true);

drop policy if exists faculties_insert_auth on public.faculties;
create policy faculties_insert_auth
  on public.faculties for insert
  to authenticated
  with check (true);

drop policy if exists materials_select_approved_or_owner on public.materials;
create policy materials_select_approved_or_owner
  on public.materials for select
  using (status = 'approved' or auth.uid() = owner_id);

drop policy if exists materials_insert_own_pending on public.materials;
create policy materials_insert_own_pending
  on public.materials for insert
  with check (auth.uid() = owner_id and status = 'pending');

drop policy if exists materials_update_own on public.materials;
create policy materials_update_own
  on public.materials for update
  using (auth.uid() = owner_id);

drop policy if exists saved_materials_select_own on public.saved_materials;
create policy saved_materials_select_own
  on public.saved_materials for select
  using (auth.uid() = user_id);

drop policy if exists saved_materials_insert_own on public.saved_materials;
create policy saved_materials_insert_own
  on public.saved_materials for insert
  with check (auth.uid() = user_id);

drop policy if exists saved_materials_delete_own on public.saved_materials;
create policy saved_materials_delete_own
  on public.saved_materials for delete
  using (auth.uid() = user_id);

drop policy if exists posts_select_public on public.posts;
create policy posts_select_public
  on public.posts for select
  using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
  on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own
  on public.posts for update
  using (auth.uid() = author_id);

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own
  on public.posts for delete
  using (auth.uid() = author_id);

drop policy if exists comments_select_public on public.comments;
create policy comments_select_public
  on public.comments for select
  using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own
  on public.comments for insert
  with check (auth.uid() = author_id);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own
  on public.comments for update
  using (auth.uid() = author_id);

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own
  on public.comments for delete
  using (auth.uid() = author_id);

drop policy if exists likes_select_public on public.likes;
create policy likes_select_public
  on public.likes for select
  using (true);

drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own
  on public.likes for insert
  with check (auth.uid() = user_id);

drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own
  on public.likes for delete
  using (auth.uid() = user_id);

drop policy if exists saved_posts_select_own on public.saved_posts;
create policy saved_posts_select_own
  on public.saved_posts for select
  using (auth.uid() = user_id);

drop policy if exists saved_posts_insert_own on public.saved_posts;
create policy saved_posts_insert_own
  on public.saved_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists saved_posts_delete_own on public.saved_posts;
create policy saved_posts_delete_own
  on public.saved_posts for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, email)
  values (
    new.id,
    lower(
      regexp_replace(
        coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
        '[^a-zA-Z0-9_]+',
        '-',
        'g'
      )
    ) || '-' || left(new.id::text, 8),
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (id) do update
    set username = coalesce(public.profiles.username, excluded.username),
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.increment_material_view(material_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.materials
  set views_count = views_count + 1
  where id = $1;
$$;

create or replace function public.calculate_reputation(
  profile_id uuid,
  filter_subject text default null,
  filter_vestibular text default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with approved_materials as (
    select m.id
    from public.materials m
    where m.owner_id = profile_id
      and m.status = 'approved'
      and (filter_subject is null or m.subject = filter_subject)
      and (filter_vestibular is null or m.vestibular = filter_vestibular)
  ),
  material_points as (
    select count(*)::integer * 20 as points
    from approved_materials
  ),
  material_like_points as (
    select count(*)::integer * 2 as points
    from public.likes l
    join approved_materials am on am.id = l.target_id
    where l.target_type = 'material'
  ),
  material_save_points as (
    select count(*)::integer * 5 as points
    from public.saved_materials sm
    join approved_materials am on am.id = sm.material_id
  ),
  authored_posts as (
    select p.id
    from public.posts p
    left join public.materials m on m.id = p.material_id
    where p.author_id = profile_id
      and (filter_subject is null or m.subject = filter_subject)
      and (filter_vestibular is null or m.vestibular = filter_vestibular)
  ),
  post_points as (
    select count(*)::integer * 5 as points
    from authored_posts
  ),
  comment_points as (
    select count(*)::integer * 3 as points
    from public.comments c
    join public.posts p on p.id = c.post_id
    left join public.materials m on m.id = p.material_id
    where c.author_id = profile_id
      and (filter_subject is null or m.subject = filter_subject)
      and (filter_vestibular is null or m.vestibular = filter_vestibular)
  )
  select
    coalesce((select points from material_points), 0)
    + coalesce((select points from material_like_points), 0)
    + coalesce((select points from material_save_points), 0)
    + coalesce((select points from comment_points), 0)
    + coalesce((select points from post_points), 0);
$$;

create or replace function public.get_reputation_ranking(
  filter_subject text default null,
  filter_vestibular text default null,
  limit_count integer default 50
)
returns table (
  position bigint,
  profile_id uuid,
  username text,
  full_name text,
  avatar_url text,
  city text,
  state text,
  dream_faculty text,
  total_points integer,
  approved_materials integer,
  material_likes_received integer,
  material_saves_received integer,
  comments_made integer,
  posts_created integer
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      p.id as profile_id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.city,
      p.state,
      p.dream_faculty,
      public.calculate_reputation(p.id, filter_subject, filter_vestibular) as total_points,
      (
        select count(*)::integer
        from public.materials m
        where m.owner_id = p.id
          and m.status = 'approved'
          and (filter_subject is null or m.subject = filter_subject)
          and (filter_vestibular is null or m.vestibular = filter_vestibular)
      ) as approved_materials,
      (
        select count(*)::integer
        from public.likes l
        join public.materials m on m.id = l.target_id
        where l.target_type = 'material'
          and m.owner_id = p.id
          and m.status = 'approved'
          and (filter_subject is null or m.subject = filter_subject)
          and (filter_vestibular is null or m.vestibular = filter_vestibular)
      ) as material_likes_received,
      (
        select count(*)::integer
        from public.saved_materials sm
        join public.materials m on m.id = sm.material_id
        where m.owner_id = p.id
          and m.status = 'approved'
          and (filter_subject is null or m.subject = filter_subject)
          and (filter_vestibular is null or m.vestibular = filter_vestibular)
      ) as material_saves_received,
      (
        select count(*)::integer
        from public.comments c
        join public.posts po on po.id = c.post_id
        left join public.materials m on m.id = po.material_id
        where c.author_id = p.id
          and (filter_subject is null or m.subject = filter_subject)
          and (filter_vestibular is null or m.vestibular = filter_vestibular)
      ) as comments_made,
      (
        select count(*)::integer
        from public.posts po
        left join public.materials m on m.id = po.material_id
        where po.author_id = p.id
          and (filter_subject is null or m.subject = filter_subject)
          and (filter_vestibular is null or m.vestibular = filter_vestibular)
      ) as posts_created
    from public.profiles p
  ),
  ranked as (
    select
      row_number() over (
        order by total_points desc, full_name asc nulls last, username asc nulls last
      ) as position,
      *
    from base
    where total_points > 0
  )
  select
    ranked.position,
    ranked.profile_id,
    ranked.username,
    ranked.full_name,
    ranked.avatar_url,
    ranked.city,
    ranked.state,
    ranked.dream_faculty,
    ranked.total_points,
    ranked.approved_materials,
    ranked.material_likes_received,
    ranked.material_saves_received,
    ranked.comments_made,
    ranked.posts_created
  from ranked
  order by ranked.position
  limit greatest(limit_count, 1);
$$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'materials',
  'materials',
  true,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_materials_select_public on storage.objects;
create policy storage_materials_select_public
  on storage.objects for select
  using (bucket_id = 'materials');

drop policy if exists storage_materials_insert_own on storage.objects;
create policy storage_materials_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_materials_update_own on storage.objects;
create policy storage_materials_update_own
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_materials_delete_own on storage.objects;
create policy storage_materials_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
