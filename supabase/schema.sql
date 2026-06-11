-- Marathon Tracker schema. Run this once in the Supabase SQL editor.
-- The app talks to these tables with the service-role key from API routes only,
-- so RLS stays enabled with no public policies (deny-all to anon).

create table if not exists day_log (
  date date primary key,
  run_done boolean not null default false,
  lift_done boolean not null default false,
  actual_miles numeric,
  actual_pace text,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists day_override (
  date date primary key,
  patch jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table day_log enable row level security;
alter table day_override enable row level security;
alter table settings enable row level security;
