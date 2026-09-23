-- Private NSFW AI companion: one persona and thread per user.

create table if not exists companion_profiles (
  user_id text primary key,
  name text not null default '',
  gender text not null default '',
  role text not null default '',
  address_as text not null default '',
  voice text not null default '',
  persona text not null default '',
  appearance text not null default '',
  kinks text not null default '',
  limits text not null default '',
  avatar_data text,
  updated_at timestamptz not null default now()
);

create table if not exists companion_messages (
  id serial primary key,
  user_id text not null,
  role text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists companion_messages_user_idx
  on companion_messages (user_id, created_at);
