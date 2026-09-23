-- House settings (bond-level permissions + app prefs), per-user options, live location sharing.

create table if not exists house_settings (
  bond_id text primary key,
  settings text not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists user_options (
  user_id text primary key,
  options text not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists location_shares (
  user_id text primary key,
  bond_id text not null,
  sharing boolean not null default false,
  lat double precision,
  lng double precision,
  accuracy double precision,
  place_name text not null default '',
  updated_at timestamptz
);

create index if not exists location_shares_bond_idx on location_shares (bond_id);
