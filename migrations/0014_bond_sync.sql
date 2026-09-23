-- Lightweight revision counter so connected partners pick up each other's writes.

create table if not exists bond_sync (
  bond_id text primary key,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
