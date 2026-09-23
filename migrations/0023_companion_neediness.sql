-- How often the companion writes first.
alter table companion_profiles add column if not exists neediness integer not null default 3;
