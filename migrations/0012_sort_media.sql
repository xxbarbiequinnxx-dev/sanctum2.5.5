-- Manual order, voice notes, and category order.

alter table entries
  add column if not exists sort_order int not null default 0;

alter table categories
  add column if not exists sort_order int not null default 0;

alter table messages
  add column if not exists audio_data text;
