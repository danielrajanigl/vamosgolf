create extension if not exists "uuid-ossp";

-- Catalog
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  type text check (type in ('reise','addon','training','mitgliedschaft','video')) not null,
  category_id uuid references categories(id),
  parent_product_id uuid references products(id) on delete set null,
  description_md text,
  cover_url text,
  stripe_product_id text unique,
  is_active boolean default true,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists prices (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  stripe_price_id text unique not null,
  currency text not null,
  unit_amount integer not null,
  interval text check (interval in ('onetime','month','year')) default 'onetime',
  nickname text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Profiles & Trips
create table if not exists vamosgolf_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text check (role in ('admin','editor','client')) default 'client',
  created_at timestamptz default now()
);

create table if not exists vamosgolf_trips (
  id uuid primary key default uuid_generate_v4(),
  slug text unique,
  title jsonb not null,
  description jsonb,
  image_url text,
  product_id uuid references products(id),
  stripe_product_id text,
  stripe_price_id text,
  base_price_cents integer,
  currency text default 'EUR',
  vat_included boolean default true,
  min_participants int not null,
  max_participants int not null,
  status text check (status in ('draft','published')) default 'draft',
  created_by uuid references vamosgolf_profiles(id),
  created_at timestamptz default now()
);

create table if not exists vamosgolf_trip_packages (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references vamosgolf_trips(id) on delete cascade,
  title jsonb not null,
  description jsonb,
  image_url text,
  price_delta_cents integer not null default 0,
  stripe_price_id text,
  active boolean default true
);

create table if not exists vamosgolf_trip_dates (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references vamosgolf_trips(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  min_participants int not null,
  max_participants int not null,
  current_bookings int not null default 0,
  supplier_policy jsonb,
  status text check (status in ('planned','confirmed','cancelled')) default 'planned'
);

-- Ordering
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references vamosgolf_profiles(id),
  total_amount integer not null,
  currency text not null,
  status text check (status in ('pending','paid','canceled','refunded')) default 'pending',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text unique,
  metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  price_id uuid references prices(id),
  quantity integer not null default 1,
  unit_amount integer not null,
  name_snapshot text,
  meta jsonb,
  created_at timestamptz default now()
);

create table if not exists travel_bookings (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  trip_id uuid references vamosgolf_trips(id),
  trip_date_id uuid references vamosgolf_trip_dates(id),
  package_ids uuid[] default '{}',
  persons int not null default 1,
  notes text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Add-ons
create table if not exists addons (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  trip_id uuid references vamosgolf_trips(id) on delete cascade,
  title text not null,
  description text,
  stripe_price_id text,
  price_delta_cents integer default 0,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references vamosgolf_profiles(id),
  product_id uuid references products(id),
  addon_id uuid references addons(id),
  order_id uuid references orders(id) on delete set null,
  stripe_session_id text,
  stripe_price_id text,
  quantity int not null default 1,
  amount_cents integer not null,
  currency text not null default 'EUR',
  metadata jsonb,
  created_at timestamptz default now()
);

-- Legacy / Existing Booking flow
create table if not exists vamosgolf_bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references vamosgolf_profiles(id),
  trip_id uuid references vamosgolf_trips(id),
  trip_date_id uuid references vamosgolf_trip_dates(id),
  package_ids uuid[] default '{}',
  persons int not null default 1,
  deposit_percent int not null default 20,
  deposit_amount_cents int not null,
  rest_amount_cents int not null,
  auto_charge_rest boolean not null default false,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  latest_payment_intent text,
  payment_status text check (payment_status in ('none','deposit_paid','paid','refunded','failed')) default 'none',
  created_at timestamptz default now()
);

create table if not exists vamosgolf_cancel_rules (
  id serial primary key,
  trip_id uuid references vamosgolf_trips(id) on delete cascade,
  rule jsonb not null
);

-- RLS
alter table categories enable row level security;
alter table products enable row level security;
alter table prices enable row level security;
alter table vamosgolf_profiles enable row level security;
alter table vamosgolf_trips enable row level security;
alter table vamosgolf_trip_packages enable row level security;
alter table vamosgolf_trip_dates enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table travel_bookings enable row level security;
alter table addons enable row level security;
alter table purchases enable row level security;
alter table vamosgolf_bookings enable row level security;
alter table vamosgolf_cancel_rules enable row level security;
