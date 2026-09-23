-- Archive / suppress flags so built-in and custom categories can be edited, archived, or removed.

alter table categories add column if not exists archived boolean not null default false;
alter table categories add column if not exists suppressed boolean not null default false;
