-- Companion long-term memory and appointments learned from conversation.

create table if not exists companion_memories (
  id serial primary key,
  user_id text not null,
  kind text not null default 'fact',
  body text not null,
  due_at timestamptz,
  salience int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companion_memories_user_idx
  on companion_memories (user_id, updated_at desc);

create index if not exists companion_memories_due_idx
  on companion_memories (user_id, due_at);
