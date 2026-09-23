-- Companion can text first and keep writing without a reply.
alter table companion_profiles add column if not exists next_nudge_at timestamptz;
alter table companion_profiles add column if not exists nudge_streak integer not null default 0;
