-- Username, play mode, setup flag, switch role, talk-answer visibility.

alter table profiles
  add column if not exists username text not null default '';

alter table profiles
  add column if not exists play_mode text not null default 'solo';

alter table profiles
  add column if not exists setup_done boolean not null default true;

update profiles
  set username = display_name
  where username = '' and display_name <> '';

update profiles
  set play_mode = 'pair'
  where partner_user_id is not null and play_mode = 'solo';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('dominant', 'submissive', 'switch'));

alter table talk_answers
  add column if not exists visibility text not null default 'shared';
