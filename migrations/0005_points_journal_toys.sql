-- Points ledger, journal comments, and reusable toy patterns.

create table if not exists points_ledger (
  id serial primary key,
  bond_id text not null,
  user_id text not null,
  delta int not null,
  reason text not null default '',
  source text not null default 'manual',
  entry_id int,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists points_ledger_bond_idx on points_ledger (bond_id, created_at desc);
create index if not exists points_ledger_user_idx on points_ledger (bond_id, user_id);

create table if not exists journal_comments (
  id serial primary key,
  bond_id text not null,
  entry_id int not null,
  author_id text not null,
  body text not null default '',
  photo_data text,
  created_at timestamptz not null default now()
);

create index if not exists journal_comments_entry_idx on journal_comments (entry_id, created_at);
create index if not exists journal_comments_bond_idx on journal_comments (bond_id, created_at);

create table if not exists toy_patterns (
  id serial primary key,
  bond_id text not null,
  created_by text not null,
  title text not null,
  steps text not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists toy_patterns_bond_idx on toy_patterns (bond_id, created_at desc);
