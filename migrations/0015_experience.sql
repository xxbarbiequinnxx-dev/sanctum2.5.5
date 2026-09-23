-- How experienced each person is in their role. Editable as they grow.

alter table profiles
  add column if not exists experience text not null default 'beginner';
