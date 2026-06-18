-- ============================================================
-- Rally — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ============================================================

-- Enable extensions ------------------------------------------------
create extension if not exists "pgcrypto";

-- Cause categories enum -------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cause_category') then
    create type cause_category as enum ('rights','environment','labour','government','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type event_status as enum ('pending','approved','rejected');
  end if;
end$$;

-- Events -----------------------------------------------------------
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  cause_category   cause_category not null default 'other',
  description      text not null default '',
  date             timestamptz not null,
  address          text not null,
  lat              double precision not null,
  lng              double precision not null,
  organiser_name   text not null,
  organiser_email  text not null,
  attendance_count integer not null default 0,
  status           event_status not null default 'pending',
  ai_summary       text,                       -- cached Claude summary
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists events_status_idx on public.events (status);
create index if not exists events_category_idx on public.events (cause_category);
create index if not exists events_date_idx on public.events (date);

-- RSVPs ------------------------------------------------------------
create table if not exists public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists rsvps_event_idx on public.rsvps (event_id);
create index if not exists rsvps_user_idx on public.rsvps (user_id);

-- ============================================================
-- Auto-approve: events flip pending -> approved after 10 min.
-- Two layers so the MVP works with or without pg_cron:
--   (1) A view-time function the client/Edge can call.
--   (2) An optional pg_cron job (uncomment if available).
-- ============================================================
create or replace function public.auto_approve_events()
returns void
language sql
security definer
as $$
  update public.events
     set status = 'approved'
   where status = 'pending'
     and created_at < now() - interval '10 minutes';
$$;

-- Optional: schedule it every minute (requires the pg_cron extension,
-- available on Supabase Pro+). Safe to skip on free tier.
-- create extension if not exists pg_cron;
-- select cron.schedule('rally-auto-approve', '* * * * *', $$select public.auto_approve_events();$$);

-- ============================================================
-- RSVP helper: insert rsvp + bump counter atomically.
-- Called from the client via supabase.rpc('rsvp_event', ...).
-- ============================================================
create or replace function public.rsvp_event(p_event_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Authentication required to RSVP';
  end if;

  insert into public.rsvps (event_id, user_id)
  values (p_event_id, v_uid)
  on conflict (event_id, user_id) do nothing;

  -- Recompute the attendance count from real rsvps so it stays accurate.
  select count(*) into v_count from public.rsvps where event_id = p_event_id;

  update public.events
     set attendance_count = greatest(attendance_count, v_count)
   where id = p_event_id
   returning attendance_count into v_count;

  return v_count;
end;
$$;

-- ============================================================
-- Cache an AI summary for an event (called by the Edge Function).
-- ============================================================
create or replace function public.set_event_summary(p_event_id uuid, p_summary text)
returns void
language sql
security definer
as $$
  update public.events set ai_summary = p_summary where id = p_event_id;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.events enable row level security;
alter table public.rsvps  enable row level security;

-- Anyone (even anon) can read APPROVED events; owners can read their own pending.
drop policy if exists "events_read_approved" on public.events;
create policy "events_read_approved" on public.events
  for select using (
    status = 'approved'
    or created_by = auth.uid()
  );

-- Authenticated users can submit events (forced to pending + self as owner).
drop policy if exists "events_insert_auth" on public.events;
create policy "events_insert_auth" on public.events
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and status = 'pending'
  );

-- Owners can update their own events.
drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- RSVPs: users manage only their own.
drop policy if exists "rsvps_read_own" on public.rsvps;
create policy "rsvps_read_own" on public.rsvps
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "rsvps_insert_own" on public.rsvps;
create policy "rsvps_insert_own" on public.rsvps
  for insert to authenticated with check (user_id = auth.uid());

-- Allow the helper RPCs to run for anon/auth (they are SECURITY DEFINER).
grant execute on function public.auto_approve_events() to anon, authenticated;
grant execute on function public.rsvp_event(uuid) to authenticated;
grant execute on function public.set_event_summary(uuid, text) to anon, authenticated, service_role;
