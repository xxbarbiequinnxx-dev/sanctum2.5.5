-- How long a shared pin has been at the current place.

alter table location_shares
  add column if not exists arrived_at timestamptz;
