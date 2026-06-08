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

create index if not exists book_reports_book_id_idx on public.book_reports (book_id);
create index if not exists book_reports_reporter_idx on public.book_reports (reporter_user_id);
create index if not exists book_reports_status_idx on public.book_reports (status, created_at desc);
create unique index if not exists book_reports_one_active_per_user_book_idx
on public.book_reports (book_id, reporter_user_id)
where status in ('open', 'reviewing');

drop trigger if exists book_reports_updated_at on public.book_reports;
create trigger book_reports_updated_at before update on public.book_reports
for each row execute function public.set_updated_at();

alter table public.book_reports enable row level security;

drop policy if exists "deny direct client book reports" on public.book_reports;
create policy "deny direct client book reports" on public.book_reports
for all using (false) with check (false);
