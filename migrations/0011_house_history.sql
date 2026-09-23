-- Shared house calendar: app opens, location stays, and change log.

create table if not exists app_opens (
  id serial primary key,
  user_id text not null,
  bond_id text not null,
  opened_at timestamptz not null default now()
);
create index if not exists app_opens_user_idx on app_opens (user_id, opened_at desc);
create index if not exists app_opens_bond_idx on app_opens (bond_id, opened_at desc);

create table if not exists location_visits (
  id serial primary key,
  user_id text not null,
  bond_id text not null,
  place_name text not null default '',
  lat double precision,
  lng double precision,
  arrived_at timestamptz not null default now(),
  departed_at timestamptz
);
create index if not exists location_visits_bond_idx on location_visits (bond_id, arrived_at desc);
create index if not exists location_visits_open_idx on location_visits (user_id, departed_at);

create table if not exists house_events (
  id serial primary key,
  bond_id text not null,
  actor_id text not null,
  action text not null,
  entity text not null default '',
  title text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists house_events_bond_idx on house_events (bond_id, created_at desc);
