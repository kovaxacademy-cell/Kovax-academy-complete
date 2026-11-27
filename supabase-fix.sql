-- ============================================================
-- KOD 1 — kreye tab "messages" (sa k fè erè PGRST205 la)
-- Kole l nan Supabase > SQL Editor > New query > Run
-- ============================================================
create table if not exists messages (
  id bigserial primary key, created_at timestamptz default now(),
  kind text, name text, email text, phone text, subject text, body text, data jsonb, read boolean default false);
create index if not exists messages_created_idx on messages(created_at desc);
alter table messages enable row level security;

-- ============================================================
-- KOD 2 — bay "service_role" dwa konplè sou tout tab yo + rafrechi cache la
-- (erè 42501 "violates row-level security" la)
-- Kole l nan yon NOUVO query epi Run
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['settings','content','pages','visits','payments','errors','messages'] loop
    execute format('grant all on table public.%I to service_role', t);
    execute format('drop policy if exists "service_all" on public.%I', t);
    execute format('create policy "service_all" on public.%I for all to service_role using (true) with check (true)', t);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;
notify pgrst, 'reload schema';
