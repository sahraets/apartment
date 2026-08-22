-- items: ting man ønsker seg / har kjøpt til et rom.
--
-- Tabellen finnes allerede i det kjørende Supabase-prosjektet (verifisert mot
-- REST-API-et 2026-08-20); denne filen dokumenterer skjemaet slik det faktisk
-- er, og lar et nytt/tomt prosjekt settes opp likt. Alt er idempotent, så den
-- kan kjøres mot den eksisterende databasen uten å ødelegge data.
--
-- Forutsetter at `rooms` finnes (id = tekst-slug, f.eks. "stue").

create table if not exists public.items (
  id         uuid primary key default gen_random_uuid(),
  room_id    text not null references public.rooms (id) on delete cascade,
  name       text not null,
  price      integer not null default 0,
  status     text not null default 'wished'
               check (status in ('wished', 'ordered', 'bought')),
  image_url  text,
  url        text,
  note       text,
  created_at timestamptz not null default now()
);

-- Rompanelet henter alltid ting filtrert på rom, og sortert på opprettelse.
create index if not exists items_room_id_created_at_idx
  on public.items (room_id, created_at);

-- Samme regel som valideringen i /server/services/itemService.ts.
-- Egen ALTER fordi tabellen i det eksisterende prosjektet ble laget uten den.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'items_price_nonnegative'
  ) then
    alter table public.items
      add constraint items_price_nonnegative check (price >= 0);
  end if;
end
$$;

-- RLS: appen snakker med Supabase via anon-nøkkelen (delt leilighet, ingen
-- innlogging ennå), så anon må kunne lese og skrive. Strammes inn når/hvis
-- det kommer ekte brukere.
alter table public.items enable row level security;

drop policy if exists "items er åpne for anon" on public.items;
create policy "items er åpne for anon"
  on public.items
  for all
  to anon
  using (true)
  with check (true);
