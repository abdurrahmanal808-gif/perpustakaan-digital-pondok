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
