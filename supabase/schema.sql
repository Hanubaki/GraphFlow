-- ==============================================================================
-- GraphFlow Production Database Schema & Security Policies (Supabase / Postgres)
-- ==============================================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table (Synchronized with auth.users & Lemon Squeezy)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro', 'team')),
  lemon_customer_id text,
  lemon_subscription_id text,
  kvkk_acknowledged_at timestamptz,
  explicit_cloud_sync_consent boolean not null default false,
  commercial_iys_consent boolean not null default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Automatic Profile Creation Trigger on Sign Up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, plan_tier)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3b. Billing Field Guard
-- RLS lets users update their own profile row, which would otherwise include
-- plan_tier. Client roles (anon / authenticated) can never set billing fields;
-- only the Lemon Squeezy webhook (service_role) and internal triggers can.
-- Security invoker on purpose: current_user must be the calling role.
create or replace function public.protect_profile_billing_fields()
returns trigger as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.plan_tier := 'free';
      new.lemon_customer_id := null;
      new.lemon_subscription_id := null;
    else
      new.plan_tier := old.plan_tier;
      new.lemon_customer_id := old.lemon_customer_id;
      new.lemon_subscription_id := old.lemon_subscription_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists protect_profile_billing_fields on public.profiles;
create trigger protect_profile_billing_fields
  before insert or update on public.profiles
  for each row execute procedure public.protect_profile_billing_fields();

-- 4. Cloud Architecture Projects Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'Untitled Architecture',
  description text default '',
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  is_public boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Projects Policies
drop policy if exists "Users can view own or public projects" on public.projects;
create policy "Users can view own or public projects"
  on public.projects for select
  using (auth.uid() = user_id or is_public = true);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- 6. Anonymous funnel events (written by src/utils/funnel.ts, insert-only for the public anon key)
create table if not exists public.funnel_events (
  id bigint generated always as identity primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  sid text not null check (char_length(sid) <= 64),
  event text not null check (char_length(event) <= 40),
  device text not null default 'desktop' check (device in ('mobile', 'desktop')),
  entry text not null default 'landing' check (char_length(entry) <= 20),
  ref text not null default '' check (char_length(ref) <= 80),
  utm text not null default '' check (char_length(utm) <= 40),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2048)
);

alter table public.funnel_events enable row level security;

-- Anyone can append events; nobody can read them through the public API (use the Supabase dashboard / service role).
drop policy if exists "Anyone can insert funnel events" on public.funnel_events;
create policy "Anyone can insert funnel events"
  on public.funnel_events for insert
  to anon, authenticated
  with check (true);

create index if not exists idx_funnel_events_created_at on public.funnel_events(created_at desc);
create index if not exists idx_funnel_events_sid on public.funnel_events(sid);

-- Funnel summary: unique sessions that reached each step, by device and entry type.
-- Usage: select * from public.funnel_summary where day > now() - interval '7 days' order by day desc, device;
create or replace view public.funnel_summary with (security_invoker = true) as
select
  date_trunc('day', created_at) as day,
  device,
  entry,
  count(distinct sid) filter (where event = 'Session Started') as sessions,
  count(distinct sid) filter (where event = 'Studio Opened') as studio_opened,
  count(distinct sid) filter (where event = 'Studio Engaged') as engaged,
  count(distinct sid) filter (where event = 'Signup Prompt Clicked') as signup_clicked,
  count(distinct sid) filter (where event = 'Pricing Opened') as pricing_opened,
  count(distinct sid) filter (where event = 'Checkout Clicked') as checkout_clicked
from public.funnel_events
group by 1, 2, 3;

-- Indexes for lightning fast queries
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);
create index if not exists idx_profiles_lemon_cust on public.profiles(lemon_customer_id);
