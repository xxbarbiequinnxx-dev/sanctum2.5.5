-- Sanctum: profiles, pairing, and shared entries for a Dominant/Submissive bond.

create table if not exists profiles (
  user_id text primary key,
  role text not null check (role in ('dominant', 'submissive')),
  display_name text not null default '',
  pairing_code text not null unique,
  partner_user_id text,
  bond_id text not null,
  avatar_data text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_pairing_code_idx on profiles (pairing_code);
create index if not exists profiles_bond_id_idx on profiles (bond_id);

create table if not exists entries (
  id serial primary key,
  bond_id text not null,
  created_by text not null,
  kind text not null,
  title text not null,
  body text not null default '',
  cadence text,
  weekday int,
  status text not null default 'open',
  category text,
  intensity int,
  photo_data text,
  meta text not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_on date
);

create index if not exists entries_bond_kind_idx on entries (bond_id, kind);
create index if not exists entries_bond_created_idx on entries (bond_id, created_at desc);
