-- ============================================================
-- Alexandria Marketing Performance Dashboard — v2
-- Supabase PostgreSQL Schema — Siap Pakai
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- Project: tiewqtujysbdityzubic
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES (extends auth.users) ───────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  role        text not null check (role in ('superadmin','manager','leader','staff')) default 'staff',
  team        text,
  avatar_url  text,
  phone       text,
  is_online   boolean default false,
  last_seen   timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Superadmin can manage all profiles"
  on public.profiles for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
  );

-- ─── CAMPAIGNS ───────────────────────────────────────────────────────────────
create table public.campaigns (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  status      text not null check (status in ('active','paused','completed','draft')) default 'draft',
  budget      bigint default 0,
  start_date  date,
  end_date    date,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.campaigns enable row level security;
create policy "Campaigns viewable by authenticated users"
  on public.campaigns for select using (auth.role() = 'authenticated');
create policy "Manager+ can manage campaigns"
  on public.campaigns for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager','leader'))
  );

-- Staff-campaign junction
create table public.campaign_staff (
  campaign_id uuid references public.campaigns(id) on delete cascade,
  staff_id    uuid references public.profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  primary key (campaign_id, staff_id)
);

-- ─── PERFORMANCE RECORDS ──────────────────────────────────────────────────────
create table public.performances (
  id              uuid primary key default uuid_generate_v4(),
  staff_id        uuid references public.profiles(id) on delete cascade not null,
  campaign_id     uuid references public.campaigns(id) on delete set null,
  record_date     date not null default current_date,
  leads_in        integer default 0,
  prospect        integer default 0,
  meeting         integer default 0,
  proposal        integer default 0,
  closing         integer default 0,
  revenue         bigint default 0,
  follow_up       integer default 0,
  treatment_new   integer default 0,
  treatment_old   integer default 0,
  attendance      text check (attendance in ('hadir','wfh','izin','alpa','dinas')) default 'hadir',
  check_in_time   text,
  check_out_time  text,
  notes           text,
  score           integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(staff_id, record_date)
);

alter table public.performances enable row level security;
create policy "Performances viewable by team members"
  on public.performances for select using (
    auth.uid() = staff_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager','leader'))
  );
create policy "Staff can insert own performance"
  on public.performances for insert with check (auth.role() = 'authenticated');
create policy "Staff can update own performance"
  on public.performances for update using (
    auth.uid() = staff_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager'))
  );

-- ─── GOALS / OKR ─────────────────────────────────────────────────────────────
create table public.goals (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  target_value numeric default 0,
  current_value numeric default 0,
  unit         text default '',
  deadline     date,
  priority     text check (priority in ('high','medium','low')) default 'medium',
  status       text check (status in ('on-track','at-risk','behind','completed')) default 'on-track',
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.goals enable row level security;
create policy "Goals viewable by authenticated users"
  on public.goals for select using (auth.role() = 'authenticated');
create policy "Manager+ can manage goals"
  on public.goals for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager','leader'))
  );

-- ─── COMMISSIONS ─────────────────────────────────────────────────────────────
create table public.commissions (
  id              uuid primary key default uuid_generate_v4(),
  staff_id        uuid references public.profiles(id) on delete cascade not null,
  period_month    text not null,
  revenue_total   bigint default 0,
  commission_rate numeric(5,2) default 5.00,
  commission_amt  bigint generated always as (revenue_total * commission_rate / 100) stored,
  bonus_score     integer default 0,
  bonus_amt       bigint default 0,
  incentive_amt   bigint default 0,
  grand_total     bigint generated always as (
    (revenue_total * commission_rate / 100) + bonus_amt + incentive_amt
  ) stored,
  is_paid         boolean default false,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz default now(),
  unique(staff_id, period_month)
);

alter table public.commissions enable row level security;
create policy "Staff can view own commission"
  on public.commissions for select using (
    auth.uid() = staff_id or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager'))
  );
create policy "Manager+ can manage commissions"
  on public.commissions for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager'))
  );

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  message     text not null,
  type        text check (type in ('info','success','warning','error')) default 'info',
  is_read     boolean default false,
  link        text,
  created_at  timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);
create policy "System can insert notifications"
  on public.notifications for insert with check (true);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
create table public.activity_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  details     jsonb,
  ip_address  inet,
  created_at  timestamptz default now()
);

alter table public.activity_logs enable row level security;
create policy "Manager+ can view activity logs"
  on public.activity_logs for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager'))
  );
create policy "System can insert activity logs"
  on public.activity_logs for insert with check (true);

-- ─── LEADS (v2 — dengan field baru) ──────────────────────────────────────────
create table public.leads (
  id                  uuid primary key default uuid_generate_v4(),

  -- Data Orang Tua
  parent_name         text not null,
  parent_phone        text,
  parent_area         text,                          -- Daerah (baru)

  -- Data Calon Siswa
  child_name          text not null,
  child_gender        text check (child_gender in ('L','P')),   -- baru
  child_class         text,
  has_sibling         boolean default false,         -- Kakak/Adik di sekolah (baru)

  -- Data Lead
  source              text,
  assigned_to         uuid references public.profiles(id),
  assigned_staff_name text,                          -- baru (nama staff)
  lead_category       text check (lead_category in ('HOT','COLD','WARM','FREEZE')), -- baru
  interest_rating     integer check (interest_rating between 1 and 5),              -- baru (1-5)
  notes               text,
  status              text check (status in ('new','contacted','interested','enrolled','lost')) default 'new',

  -- Meta
  handler_name        text,
  handler_role        text,
  campaign_id         uuid references public.campaigns(id),
  team                text,
  response_time       text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.leads enable row level security;
create policy "Leads viewable by team members"
  on public.leads for select using (
    auth.uid() = assigned_to or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager','leader'))
  );
create policy "Staff can insert leads"
  on public.leads for insert with check (auth.role() = 'authenticated');
create policy "Staff can update own leads"
  on public.leads for update using (
    auth.uid() = assigned_to or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager','leader'))
  );
create policy "Manager+ can delete leads"
  on public.leads for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('superadmin','manager','leader'))
  );

-- Lead follow-up notes
create table public.lead_notes (
  id          uuid primary key default uuid_generate_v4(),
  lead_id     uuid references public.leads(id) on delete cascade not null,
  author_id   uuid references public.profiles(id),
  author_name text,
  note        text not null,
  result      text,
  new_status  text,
  created_at  timestamptz default now()
);

alter table public.lead_notes enable row level security;
create policy "Lead notes viewable by team"
  on public.lead_notes for select using (auth.role() = 'authenticated');
create policy "Users can insert lead notes"
  on public.lead_notes for insert with check (auth.role() = 'authenticated');

-- ─── REALTIME ENABLE ─────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.performances;
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activity_logs;

-- ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update timestamps
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger set_updated_at_leads before update on public.leads
  for each row execute procedure public.handle_updated_at();
create trigger set_updated_at_goals before update on public.goals
  for each row execute procedure public.handle_updated_at();

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
-- LANGKAH: Buat akun di Supabase Auth → Authentication → Users → Add User
--
-- Akun yang perlu dibuat:
--   1. Email: superadmin@alexandria.sch.id  Password: Alexandria@2026!  → role: superadmin
--   2. Email: farhan@alexandria.sch.id      Password: Farhan@2026!      → role: staff
--   3. Email: ramram@alexandria.sch.id      Password: Ramram@2026!      → role: staff  ← Mr.Ramram
--
-- Setelah buat user, trigger akan otomatis buat profile.
-- Kemudian jalankan UPDATE berikut (ganti UUID dengan UUID asli dari auth.users):
--
-- UPDATE public.profiles SET role='superadmin', team='All'    WHERE full_name ILIKE '%superadmin%';
-- UPDATE public.profiles SET role='staff',      team='Alpha'  WHERE full_name ILIKE '%farhan%';
-- UPDATE public.profiles SET role='staff',      team='Beta'   WHERE full_name ILIKE '%ramram%';
--
-- ATAU manual:
-- UPDATE public.profiles SET full_name='Super Admin', role='superadmin', team='All'
--   WHERE id = '<uuid-superadmin>';
-- UPDATE public.profiles SET full_name='Mr. Farhan', role='staff', team='Alpha'
--   WHERE id = '<uuid-farhan>';
-- UPDATE public.profiles SET full_name='Mr. Ramram', role='staff', team='Beta'
--   WHERE id = '<uuid-ramram>';

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index idx_performances_staff_date on public.performances(staff_id, record_date desc);
create index idx_performances_date on public.performances(record_date desc);
create index idx_leads_assigned on public.leads(assigned_to);
create index idx_leads_category on public.leads(lead_category);
create index idx_leads_status on public.leads(status);
create index idx_leads_campaign on public.leads(campaign_id);
create index idx_leads_created on public.leads(created_at desc);
create index idx_activity_logs_user on public.activity_logs(user_id, created_at desc);
create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
create index idx_commissions_staff on public.commissions(staff_id, period_month);

-- ─── MIGRATION SCRIPT (jika tabel leads sudah ada) ───────────────────────────
-- Jalankan ini HANYA jika tabel leads SUDAH ADA sebelumnya dan ingin menambah kolom baru:
--
-- alter table public.leads add column if not exists parent_area text;
-- alter table public.leads add column if not exists child_gender text check (child_gender in ('L','P'));
-- alter table public.leads add column if not exists has_sibling boolean default false;
-- alter table public.leads add column if not exists assigned_staff_name text;
-- alter table public.leads add column if not exists lead_category text check (lead_category in ('HOT','COLD','WARM','FREEZE'));
-- alter table public.leads add column if not exists interest_rating integer check (interest_rating between 1 and 5);
--
-- create index if not exists idx_leads_category on public.leads(lead_category);
-- create index if not exists idx_leads_created on public.leads(created_at desc);
