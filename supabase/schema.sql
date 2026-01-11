-- Supabase schema para Imoagent
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text default 'consultant',
  full_name text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;

create table if not exists consultants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  disc_type text,
  pnl_notes text,
  created_at timestamptz default now()
);
alter table consultants enable row level security;

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  title text,
  portal text,
  url text,
  latitude numeric,
  longitude numeric,
  raw jsonb,
  created_at timestamptz default now()
);
alter table properties enable row level security;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  stage text default 'new',
  score integer default 0,
  source text,
  created_at timestamptz default now()
);
alter table leads enable row level security;

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  amount numeric,
  currency text default 'EUR',
  status text default 'pending',
  created_at timestamptz default now()
);
alter table commissions enable row level security;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free',
  voucher text,
  created_at timestamptz default now()
);
alter table subscriptions enable row level security;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references subscriptions(id) on delete cascade,
  stripe_payment_intent_id text,
  amount numeric,
  currency text default 'EUR',
  status text,
  created_at timestamptz default now()
);
alter table payments enable row level security;

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  technique text, -- Pomodoro, Time Blocking etc
  created_at timestamptz default now()
);
alter table appointments enable row level security;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  title text,
  status text default 'todo',
  priority integer default 0,
  created_at timestamptz default now()
);
alter table tasks enable row level security;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  title text,
  storage_path text,
  ocr_text text,
  created_at timestamptz default now()
);
alter table documents enable row level security;

create table if not exists storage_files (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  version integer default 1,
  url text,
  created_at timestamptz default now()
);
alter table storage_files enable row level security;

create table if not exists coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  goal text,
  summary text,
  kpis jsonb,
  created_at timestamptz default now()
);
alter table coaching_sessions enable row level security;

create table if not exists kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  metric text,
  value numeric,
  captured_at timestamptz default now()
);
alter table kpi_snapshots enable row level security;

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  reward text,
  created_at timestamptz default now()
);
alter table competitions enable row level security;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  message text,
  level text,
  created_at timestamptz default now()
);
alter table notifications enable row level security;

-- políticas simples de exemplo
create policy if not exists "own-data-profiles" on profiles for select using (auth.uid() = id);
create policy if not exists "own-data-tables" on leads for select using (auth.uid() = profile_id);
