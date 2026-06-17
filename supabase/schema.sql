create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  city text,
  target_exam text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  subject text not null,
  material_type text not null,
  file_url text,
  rating numeric(3, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.feed_posts enable row level security;

create policy "Perfis publicos para leitura"
  on public.profiles for select
  using (true);

create policy "Usuario atualiza o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Materiais publicos para leitura"
  on public.materials for select
  using (true);

create policy "Usuario cria materiais"
  on public.materials for insert
  with check (auth.uid() = owner_id);

create policy "Autor atualiza materiais"
  on public.materials for update
  using (auth.uid() = owner_id);

create policy "Feed publico para leitura"
  on public.feed_posts for select
  using (true);

create policy "Usuario cria posts"
  on public.feed_posts for insert
  with check (auth.uid() = author_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
