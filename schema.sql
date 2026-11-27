-- KOVAX ACADEMY — Supabase schema. Kole tout sa a nan Supabase > SQL Editor > Run.
create table if not exists settings (key text primary key, value jsonb not null, updated_at timestamptz default now());
create table if not exists content  (key text primary key, value text not null, updated_at timestamptz default now());
create table if not exists pages    (slug text primary key, title text not null default '', html text not null default '', published boolean default true, updated_at timestamptz default now());
create table if not exists visits (
  id bigserial primary key, created_at timestamptz default now(),
  path text, visitor_id text, session_id text, referrer text, country text, device text, ua text);
create index if not exists visits_created_idx on visits(created_at desc);
create table if not exists payments (
  id bigserial primary key, created_at timestamptz default now(),
  method text, status text default 'paid', amount numeric(10,2), currency text default 'USD',
  ref text unique, email text, name text, course text, country text, note text);
create table if not exists errors (
  id bigserial primary key, created_at timestamptz default now(),
  kind text, message text, page text, stack text, ua text, resolved boolean default false);
create index if not exists errors_created_idx on errors(created_at desc);

-- Sekirite: RLS aktive san okenn policy => navigatè a pa ka li/ekri dirèk.
-- Se sèlman API Vercel yo (service role key) ki touche done yo.
alter table settings enable row level security;
alter table content  enable row level security;
alter table pages    enable row level security;
alter table visits   enable row level security;
alter table payments enable row level security;
alter table errors   enable row level security;

-- Bucket piblik pou imaj admin lan upload
insert into storage.buckets (id, name, public) values ('site-media','site-media', true) on conflict (id) do nothing;

-- Mesaj (fòmilè + chat) pou admin lan
create table if not exists messages (
  id bigserial primary key, created_at timestamptz default now(),
  kind text, name text, email text, phone text, subject text, body text, data jsonb, read boolean default false);
create index if not exists messages_created_idx on messages(created_at desc);
alter table messages enable row level security;
