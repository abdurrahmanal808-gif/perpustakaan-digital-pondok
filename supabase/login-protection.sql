create table if not exists public.login_attempts (
  username text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

create or replace function public.login_attempt_status(p_username text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_locked timestamptz;
begin
  select locked_until into v_locked from public.login_attempts where username = p_username;
  return v_locked is not null and v_locked > now();
end $$;

create or replace function public.record_login_failure(p_username text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.login_attempts(username, attempts, window_started_at)
  values (p_username, 1, now())
  on conflict (username) do update set
    attempts = case when public.login_attempts.window_started_at < now() - interval '15 minutes'
      then 1 else public.login_attempts.attempts + 1 end,
    window_started_at = case when public.login_attempts.window_started_at < now() - interval '15 minutes'
      then now() else public.login_attempts.window_started_at end,
    locked_until = case when public.login_attempts.window_started_at >= now() - interval '15 minutes'
      and public.login_attempts.attempts + 1 >= 5 then now() + interval '15 minutes'
      else null end;
end $$;

create or replace function public.clear_login_attempts(p_username text)
returns void language sql security definer set search_path = public as $$
  delete from public.login_attempts where username = p_username;
$$;

revoke all on function public.login_attempt_status(text) from public, anon, authenticated;
revoke all on function public.record_login_failure(text) from public, anon, authenticated;
revoke all on function public.clear_login_attempts(text) from public, anon, authenticated;
grant execute on function public.login_attempt_status(text) to service_role;
grant execute on function public.record_login_failure(text) to service_role;
grant execute on function public.clear_login_attempts(text) to service_role;
