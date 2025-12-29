-- Leads Table für Lead-Generierung
create table if not exists vamosgolf_leads (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  full_name text,
  phone text,
  lead_type text not null check (lead_type in ('newsletter','contact','booking_inquiry','download','callback')),
  source text, -- z.B. 'homepage', 'trip-detail', 'footer'
  status text check (status in ('new','contacted','qualified','converted','lost')) default 'new',
  notes text,
  metadata jsonb, -- Zusätzliche Daten wie trip_id, message, etc.
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Newsletter Subscriptions
create table if not exists vamosgolf_newsletter_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz,
  is_active boolean default true,
  source text,
  metadata jsonb
);

-- Contact Form Submissions
create table if not exists vamosgolf_contact_submissions (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  full_name text,
  phone text,
  subject text,
  message text not null,
  source text,
  status text check (status in ('new','read','replied','archived')) default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Booking Inquiries (vor der tatsächlichen Buchung)
create table if not exists vamosgolf_booking_inquiries (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  full_name text,
  phone text,
  trip_id uuid references vamosgolf_trips(id),
  trip_date_id uuid references vamosgolf_trip_dates(id),
  persons integer,
  message text,
  preferred_contact_method text,
  status text check (status in ('new','contacted','converted','cancelled')) default 'new',
  converted_to_booking_id uuid references vamosgolf_bookings(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_leads_email on vamosgolf_leads(email);
create index if not exists idx_leads_type on vamosgolf_leads(lead_type);
create index if not exists idx_leads_status on vamosgolf_leads(status);
create index if not exists idx_leads_created on vamosgolf_leads(created_at);
create index if not exists idx_newsletter_email on vamosgolf_newsletter_subscriptions(email);
create index if not exists idx_newsletter_active on vamosgolf_newsletter_subscriptions(is_active);
create index if not exists idx_contact_status on vamosgolf_contact_submissions(status);
create index if not exists idx_inquiries_trip on vamosgolf_booking_inquiries(trip_id);
create index if not exists idx_inquiries_status on vamosgolf_booking_inquiries(status);

-- RLS Policies
alter table vamosgolf_leads enable row level security;
alter table vamosgolf_newsletter_subscriptions enable row level security;
alter table vamosgolf_contact_submissions enable row level security;
alter table vamosgolf_booking_inquiries enable row level security;

-- Public kann Leads erstellen
create policy "Anyone can create leads" on vamosgolf_leads for insert with check (true);
create policy "Admins and editors can view all leads" on vamosgolf_leads for select using (
  exists (
    select 1 from vamosgolf_profiles
    where vamosgolf_profiles.id = auth.uid()
    and vamosgolf_profiles.role in ('admin', 'editor')
  )
);

-- Newsletter: Public kann subscriben, Admins/Editors können alle sehen
create policy "Anyone can subscribe to newsletter" on vamosgolf_newsletter_subscriptions for insert with check (true);
create policy "Admins and editors can view newsletter subscriptions" on vamosgolf_newsletter_subscriptions for select using (
  exists (
    select 1 from vamosgolf_profiles
    where vamosgolf_profiles.id = auth.uid()
    and vamosgolf_profiles.role in ('admin', 'editor')
  )
);

-- Contact: Public kann senden, Admins/Editors können alle sehen
create policy "Anyone can submit contact form" on vamosgolf_contact_submissions for insert with check (true);
create policy "Admins and editors can view contact submissions" on vamosgolf_contact_submissions for select using (
  exists (
    select 1 from vamosgolf_profiles
    where vamosgolf_profiles.id = auth.uid()
    and vamosgolf_profiles.role in ('admin', 'editor')
  )
);

-- Booking Inquiries: Public kann erstellen, Admins/Editors können alle sehen
create policy "Anyone can create booking inquiry" on vamosgolf_booking_inquiries for insert with check (true);
create policy "Admins and editors can view booking inquiries" on vamosgolf_booking_inquiries for select using (
  exists (
    select 1 from vamosgolf_profiles
    where vamosgolf_profiles.id = auth.uid()
    and vamosgolf_profiles.role in ('admin', 'editor')
  )
);

