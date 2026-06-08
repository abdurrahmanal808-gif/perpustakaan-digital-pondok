create extension if not exists pg_trgm;

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

update storage.buckets
set file_size_limit = 5242880
where id = 'book-covers';
