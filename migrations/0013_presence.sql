-- Live presence for the header chips.

alter table profiles
  add column if not exists last_seen timestamptz;
