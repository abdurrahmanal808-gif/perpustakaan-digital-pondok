create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.book_type as enum ('pdf', 'scan');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.book_status as enum ('pending', 'published', 'hidden', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.book_file_kind as enum ('pdf', 'page', 'cover');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.book_report_reason as enum (
    'copyright',
    'broken_file',
    'inappropriate_content',
    'wrong_metadata',
    'duplicate',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.book_report_status as enum (
    'open',
    'reviewing',
    'resolved',
    'rejected'
  );
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  full_name text,
  password_hash text not null,
  role public.user_role not null default 'user',
  is_blocked boolean not null default false,
  blocked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint users_full_name_length check (full_name is null or length(full_name) <= 120)
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip_address text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (length(name) between 2 and 80),
  constraint categories_slug_format check (slug ~ '^[a-z0-9-]{2,100}$')
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null,
  author text,
  description text,
  book_type public.book_type not null,
  status public.book_status not null default 'pending',
  cover_path text,
  cover_storage_provider text not null default 'supabase',
  rights_confirmed boolean not null default false,
  view_count integer not null default 0,
  download_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint books_title_length check (length(title) between 1 and 180),
  constraint books_author_length check (author is null or length(author) <= 140),
  constraint books_description_length check (description is null or length(description) <= 1600),
  constraint books_cover_storage_provider_allowed check (
    cover_storage_provider in ('supabase', 'r2')
  ),
  constraint books_rights_confirmed check (rights_confirmed = true),
  constraint books_non_negative_stats check (view_count >= 0 and download_count >= 0)
);

create table if not exists public.book_files (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null unique,
  storage_provider text not null default 'supabase',
  original_name text not null,
  mime_type text not null,
  file_size bigint not null,
  file_kind public.book_file_kind not null,
  page_number integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_files_positive_size check (file_size > 0 and file_size <= 52428800),
  constraint book_files_storage_provider_allowed check (
    storage_provider in ('supabase', 'r2')
  ),
  constraint book_files_page_number check (
    (file_kind = 'page' and page_number is not null and page_number > 0)
    or (file_kind <> 'page' and page_number is null)
  ),
  constraint book_files_mime_allowed check (
    mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  )
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table if not exists public.shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name),
  constraint shelves_name_length check (length(name) between 1 and 80)
);

create table if not exists public.shelf_books (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references public.shelves(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shelf_id, book_id)
);

create table if not exists public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  last_page integer,
  progress_percent numeric(5,2) not null default 0,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id),
  constraint reading_history_last_page check (last_page is null or last_page > 0),
  constraint reading_history_progress check (progress_percent >= 0 and progress_percent <= 100)
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  book_id uuid not null references public.books(id) on delete cascade,
  book_file_id uuid references public.book_files(id) on delete set null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.book_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  book_id uuid not null references public.books(id) on delete cascade,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.book_reports (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null,
  reporter_user_id uuid not null,
  reason public.book_report_reason not null,
  description text,
  status public.book_report_status not null default 'open',
  admin_note text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_reports_book_id_fkey
    foreign key (book_id) references public.books(id) on delete cascade,
  constraint book_reports_reporter_user_id_fkey
    foreign key (reporter_user_id) references public.users(id) on delete cascade,
  constraint book_reports_resolved_by_fkey
    foreign key (resolved_by) references public.users(id) on delete set null,
  constraint book_reports_description_length check (
    description is null or length(description) <= 1000
  ),
  constraint book_reports_admin_note_length check (
    admin_note is null or length(admin_note) <= 800
  )
);

create index if not exists users_username_idx on public.users (username);
create index if not exists sessions_token_hash_idx on public.sessions (token_hash);
create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists categories_active_idx on public.categories (is_active);
create index if not exists books_user_id_idx on public.books (user_id);
create index if not exists books_category_id_idx on public.books (category_id);
create index if not exists books_status_idx on public.books (status);
create index if not exists books_type_idx on public.books (book_type);
create index if not exists books_published_at_idx on public.books (published_at desc);
create index if not exists books_view_count_idx on public.books (view_count desc);
create index if not exists books_download_count_idx on public.books (download_count desc);
create index if not exists books_search_idx on public.books using gin (
  to_tsvector(
    'simple',
    coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(description, '')
  )
);
create index if not exists books_published_newest_idx
on public.books (published_at desc, created_at desc)
where status = 'published';
create index if not exists books_published_category_newest_idx
on public.books (category_id, published_at desc, created_at desc)
where status = 'published';
create index if not exists books_published_type_newest_idx
on public.books (book_type, published_at desc, created_at desc)
where status = 'published';
create index if not exists books_published_popular_idx
on public.books (view_count desc, created_at desc)
where status = 'published';
create index if not exists books_published_downloads_idx
on public.books (download_count desc, created_at desc)
where status = 'published';
create index if not exists books_title_trgm_idx
on public.books using gin (title gin_trgm_ops);
create index if not exists books_author_trgm_idx
on public.books using gin (author gin_trgm_ops);
create index if not exists books_description_trgm_idx
on public.books using gin (description gin_trgm_ops);
create index if not exists book_files_book_id_idx on public.book_files (book_id);
create index if not exists book_files_page_idx on public.book_files (book_id, page_number);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists shelves_user_id_idx on public.shelves (user_id);
create index if not exists reading_history_user_idx on public.reading_history (user_id, last_read_at desc);
create index if not exists downloads_book_id_idx on public.downloads (book_id);
create index if not exists book_views_book_id_idx on public.book_views (book_id);
create index if not exists book_reports_book_id_idx on public.book_reports (book_id);
create index if not exists book_reports_reporter_idx on public.book_reports (reporter_user_id);
create index if not exists book_reports_status_idx on public.book_reports (status, created_at desc);
create unique index if not exists book_reports_one_active_per_user_book_idx
on public.book_reports (book_id, reporter_user_id)
where status in ('open', 'reviewing');

alter table public.books alter column cover_path drop not null;
alter table public.books
add column if not exists cover_storage_provider text not null default 'supabase';
alter table public.books
drop constraint if exists books_cover_storage_provider_allowed;
alter table public.books
add constraint books_cover_storage_provider_allowed
check (cover_storage_provider in ('supabase', 'r2'));

alter table public.book_files
add column if not exists storage_provider text not null default 'supabase';
alter table public.book_files
drop constraint if exists book_files_storage_provider_allowed;
alter table public.book_files
add constraint book_files_storage_provider_allowed
check (storage_provider in ('supabase', 'r2'));

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists sessions_updated_at on public.sessions;
create trigger sessions_updated_at before update on public.sessions
for each row execute function public.set_updated_at();

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at before update on public.books
for each row execute function public.set_updated_at();

drop trigger if exists book_files_updated_at on public.book_files;
create trigger book_files_updated_at before update on public.book_files
for each row execute function public.set_updated_at();

drop trigger if exists shelves_updated_at on public.shelves;
create trigger shelves_updated_at before update on public.shelves
for each row execute function public.set_updated_at();

drop trigger if exists reading_history_updated_at on public.reading_history;
create trigger reading_history_updated_at before update on public.reading_history
for each row execute function public.set_updated_at();

drop trigger if exists book_reports_updated_at on public.book_reports;
create trigger book_reports_updated_at before update on public.book_reports
for each row execute function public.set_updated_at();

create or replace function public.increment_book_view(
  book_id_input uuid,
  viewer_user_id_input uuid default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.book_views (book_id, user_id)
  values (book_id_input, viewer_user_id_input);

  update public.books
  set view_count = view_count + 1
  where id = book_id_input and status <> 'deleted';
end;
$$;

create or replace function public.increment_book_download(
  book_id_input uuid,
  downloader_user_id_input uuid default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.downloads (book_id, user_id)
  values (book_id_input, downloader_user_id_input);

  update public.books
  set download_count = download_count + 1
  where id = book_id_input and status <> 'deleted';
end;
$$;

insert into public.categories (name, slug, description)
values
  ('Kitab Kuning', 'kitab-kuning', 'Koleksi kitab klasik dan rujukan pesantren.'),
  ('Fiqih', 'fiqih', 'Buku dan kitab tentang fikih.'),
  ('Aqidah', 'aqidah', 'Bacaan tentang aqidah.'),
  ('Akhlak', 'akhlak', 'Bacaan adab, akhlak, dan tazkiyah.'),
  ('Tafsir', 'tafsir', 'Kitab tafsir dan ulumul Qur''an.'),
  ('Hadits', 'hadits', 'Kitab hadits dan ulumul hadits.'),
  ('Bahasa Arab', 'bahasa-arab', 'Nahwu, sharaf, balaghah, dan bahasa Arab.'),
  ('Sejarah Islam', 'sejarah-islam', 'Sirah, tarikh, dan sejarah Islam.'),
  ('Umum', 'umum', 'Bacaan umum.')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'book-files',
    'book-files',
    false,
    52428800,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'book-covers',
    'book-covers',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.book_files enable row level security;
alter table public.favorites enable row level security;
alter table public.shelves enable row level security;
alter table public.shelf_books enable row level security;
alter table public.reading_history enable row level security;
alter table public.downloads enable row level security;
alter table public.book_views enable row level security;
alter table public.book_reports enable row level security;

drop policy if exists "deny direct client users" on public.users;
create policy "deny direct client users" on public.users
for all using (false) with check (false);

drop policy if exists "deny direct client sessions" on public.sessions;
create policy "deny direct client sessions" on public.sessions
for all using (false) with check (false);

drop policy if exists "deny direct client categories" on public.categories;
create policy "deny direct client categories" on public.categories
for all using (false) with check (false);

drop policy if exists "deny direct client books" on public.books;
create policy "deny direct client books" on public.books
for all using (false) with check (false);

drop policy if exists "deny direct client book files" on public.book_files;
create policy "deny direct client book files" on public.book_files
for all using (false) with check (false);

drop policy if exists "deny direct client favorites" on public.favorites;
create policy "deny direct client favorites" on public.favorites
for all using (false) with check (false);

drop policy if exists "deny direct client shelves" on public.shelves;
create policy "deny direct client shelves" on public.shelves
for all using (false) with check (false);

drop policy if exists "deny direct client shelf books" on public.shelf_books;
create policy "deny direct client shelf books" on public.shelf_books
for all using (false) with check (false);

drop policy if exists "deny direct client reading history" on public.reading_history;
create policy "deny direct client reading history" on public.reading_history
for all using (false) with check (false);

drop policy if exists "deny direct client downloads" on public.downloads;
create policy "deny direct client downloads" on public.downloads
for all using (false) with check (false);

drop policy if exists "deny direct client book views" on public.book_views;
create policy "deny direct client book views" on public.book_views
for all using (false) with check (false);

drop policy if exists "deny direct client book reports" on public.book_reports;
create policy "deny direct client book reports" on public.book_reports
for all using (false) with check (false);

-- Storage objects are managed by Supabase Storage. On hosted Supabase projects,
-- app users are not the owner of storage.objects, so do not alter its RLS here.
-- Buckets above are private, and this app only creates signed URLs from server
-- code using SUPABASE_SERVICE_ROLE_KEY.
