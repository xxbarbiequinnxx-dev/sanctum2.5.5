-- Profile details (age, sex) plus private messages and a shared photo album.

alter table profiles add column if not exists age int;
alter table profiles add column if not exists sex text not null default '';

create table if not exists messages (
  id serial primary key,
  bond_id text not null,
  sender_id text not null,
  body text not null default '',
  photo_data text,
  created_at timestamptz not null default now()
);

create index if not exists messages_bond_created_idx on messages (bond_id, created_at);

create table if not exists private_photos (
  id serial primary key,
  bond_id text not null,
  uploaded_by text not null,
  photo_data text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists private_photos_bond_idx on private_photos (bond_id, created_at desc);
