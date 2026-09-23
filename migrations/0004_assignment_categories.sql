-- Assignment, subcategories, role style, custom categories, and partner talk answers.

alter table profiles add column if not exists role_style text not null default '';

alter table entries add column if not exists assigned_to text;
alter table entries add column if not exists subcategory text;

create table if not exists categories (
  id serial primary key,
  bond_id text not null,
  kind text not null,
  name text not null,
  slug text not null,
  parent_slug text,
  created_at timestamptz not null default now()
);

create unique index if not exists categories_bond_kind_slug_idx
  on categories (bond_id, kind, slug);
create index if not exists categories_bond_kind_idx on categories (bond_id, kind);

create table if not exists talk_answers (
  id serial primary key,
  bond_id text not null,
  topic text not null,
  user_id text not null,
  body text not null default '',
  rating text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists talk_answers_topic_user_idx
  on talk_answers (bond_id, topic, user_id);
